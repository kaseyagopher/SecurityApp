/**
 * API réelle — serveur Node (phase 4)
 */
import { apiFetch } from '../lib/api-client';
import type { AccessEvent, AlarmStatus, AppUser, AuthResponse, DoorStatus } from '../mocks/types';
import type { EnrollProgress } from './esp32-enroll';

type DoorStatusResponse = {
  state?: string;
  alarm?: string;
  fingerprint?: string;
  templates?: number;
  capacity?: number;
  esp32_online?: boolean;
  last_event?: string | null;
};

type FingerprintSlotRow = {
  id: number;
  slot_id: number;
  user_id: number;
};

type ServerUser = {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'user';
  isAuthorized: boolean;
  fingerprintSlot: number | null;
  fingerprintEnrolledAt: string | null;
};

function mapDoorStatus(data: DoorStatusResponse): DoorStatus {
  const fp = data.fingerprint ?? 'offline';
  return {
    state: 'locked',
    lastAccessAt: null,
    lastAccessBy: null,
    devices: {
      esp32: data.esp32_online ? 'online' : 'offline',
      fingerprintSensor:
        fp === 'online' ? 'online' : fp === 'offline' ? 'offline' : 'degraded',
      server: 'online',
    },
    enrolledTemplates: data.templates ?? 0,
    capacity: data.capacity ?? 128,
  };
}

function mapUser(row: ServerUser): AppUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    isAuthorized: Boolean(row.isAuthorized),
    fingerprintSlot: row.fingerprintSlot ?? null,
    fingerprintEnrolledAt: row.fingerprintEnrolledAt ?? null,
  };
}

export async function liveLogin(email: string, password: string): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function liveGetDoorStatus(): Promise<DoorStatus> {
  const data = await apiFetch<DoorStatusResponse>('/api/door/status');
  const door = mapDoorStatus(data);
  try {
    const history = await apiFetch<AccessEvent[]>('/api/history?limit=30');
    const lastOk = history.find(
      (e) => e.event_type === 'door_open' && e.result === 'success'
    );
    if (lastOk) {
      door.lastAccessAt = lastOk.created_at;
      door.lastAccessBy = lastOk.userName ?? 'Inconnu';
    }
  } catch {
    /* historique optionnel */
  }
  return door;
}

export async function liveGetHistory(limit = 50): Promise<AccessEvent[]> {
  return apiFetch<AccessEvent[]>(`/api/history?limit=${limit}`);
}

export async function liveGetUsers(): Promise<AppUser[]> {
  const rows = await apiFetch<ServerUser[]>('/api/users');
  return rows.map(mapUser);
}

export async function liveGetAlarmStatus(): Promise<AlarmStatus> {
  const data = await apiFetch<{ alarm: string }>('/api/alarm/status');
  const active = data.alarm === 'active';
  if (!active) {
    return { active: false, triggeredAt: null, reason: null };
  }
  const history = await apiFetch<AccessEvent[]>('/api/history?limit=30');
  const last = history.find((e) => e.event_type === 'alarm' && e.result === 'triggered');
  return {
    active: true,
    triggeredAt: last?.created_at ?? null,
    reason: last?.details ?? null,
  };
}

export async function liveTriggerAlarm(reason: string): Promise<AlarmStatus> {
  await apiFetch('/api/alarm/trigger', {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
  return liveGetAlarmStatus();
}

export async function liveStopAlarm(): Promise<AlarmStatus> {
  await apiFetch('/api/alarm/stop', { method: 'POST' });
  return liveGetAlarmStatus();
}

export async function liveRemoteOpen(_userName: string): Promise<DoorStatus> {
  await apiFetch('/api/door/open', { method: 'POST', body: '{}' });
  return liveGetDoorStatus();
}

export async function liveSimulateDoorAccess(
  _success: boolean,
  _userName: string | null
): Promise<DoorStatus> {
  return liveGetDoorStatus();
}

export async function liveCreateUser(data: { name: string }): Promise<AppUser> {
  const created = await apiFetch<{ id: number; email: string; name: string }>('/api/users', {
    method: 'POST',
    body: JSON.stringify({ name: data.name }),
  });
  return {
    id: created.id,
    email: created.email,
    name: created.name,
    role: 'user',
    isAuthorized: false,
    fingerprintSlot: null,
    fingerprintEnrolledAt: null,
  };
}

export async function liveSetUserAuthorized(
  userId: number,
  authorized: boolean
): Promise<AppUser[]> {
  if (authorized) {
    await apiFetch('/api/authorized-users', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
    });
  } else {
    await apiFetch(`/api/authorized-users/${userId}`, { method: 'DELETE' });
  }
  return liveGetUsers();
}

export async function liveEnrollFingerprint(
  userId: number,
  onProgress?: (p: EnrollProgress) => void
): Promise<AppUser> {
  const {
    startEsp32Enrollment,
    waitEsp32Enrollment,
    cancelEsp32Enrollment,
    deleteEsp32FingerprintSlot,
  } = await import('./esp32-enroll');

  const slots = await apiFetch<FingerprintSlotRow[]>('/api/fingerprint-slots');
  const existing = slots.find((s) => Number(s.user_id) === Number(userId));
  const previousSlotId = existing?.slot_id ?? null;

  // Exigence produit: un nouvel enrôlement doit toujours utiliser un nouveau slot.
  if (existing) {
    await deleteEsp32FingerprintSlot(existing.slot_id).catch(() => {});
    await apiFetch(`/api/fingerprint-slots/${existing.id}`, { method: 'DELETE' });
  }

  const pickNextSlot = (rows: FingerprintSlotRow[]): number => {
    const used = new Set(rows.map((s) => s.slot_id));
    let candidate = 1;
    while (
      (used.has(candidate) || (previousSlotId != null && candidate === previousSlotId)) &&
      candidate <= 127
    ) {
      candidate++;
    }
    return candidate;
  };

  let pool = slots.filter((s) => s.id !== existing?.id);
  let slotId = pickNextSlot(pool);
  if (slotId > 127) throw new Error('Capacité du capteur atteinte (127 slots)');

  let row: FingerprintSlotRow & { id: number } | null = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      row = await apiFetch<FingerprintSlotRow & { id: number }>('/api/fingerprint-slots', {
        method: 'POST',
        body: JSON.stringify({
          user_id: userId,
          slot_id: slotId,
          label: 'Assigné via application',
        }),
      });
      break;
    } catch (e) {
      if (!(e instanceof Error) || !e.message.toLowerCase().includes('assigne')) throw e;
      // Conflit concurrent ou backend ancien: recalculer un slot libre puis retenter.
      const refreshed = await apiFetch<FingerprintSlotRow[]>('/api/fingerprint-slots');
      pool = refreshed.filter((s) => Number(s.user_id) !== Number(userId));
      slotId = pickNextSlot(pool);
      if (slotId > 127) throw new Error('Capacité du capteur atteinte (127 slots)');
    }
  }
  if (!row) throw new Error("Impossible d'assigner un slot libre, réessayez.");

  try {
    await startEsp32Enrollment(slotId);
    await waitEsp32Enrollment(onProgress);
  } catch (e) {
    await cancelEsp32Enrollment().catch(() => {});
    await apiFetch(`/api/fingerprint-slots/${row.id}`, { method: 'DELETE' }).catch(() => {});
    throw e;
  }

  const users = await liveGetUsers();
  const u = users.find((x) => x.id === userId);
  if (!u) throw new Error('Utilisateur introuvable');
  return u;
}

export async function liveDeleteUser(userId: number): Promise<void> {
  const users = await liveGetUsers();
  const person = users.find((x) => x.id === userId);
  if (!person) throw new Error('Personne introuvable');
  if (person.role === 'admin') throw new Error('Impossible de supprimer un administrateur');

  if (person.fingerprintSlot != null) {
    const { deleteEsp32FingerprintSlot } = await import('./esp32-enroll');
    try {
      await deleteEsp32FingerprintSlot(person.fingerprintSlot);
    } catch {
      /* capteur hors ligne : on supprime quand même côté serveur */
    }
  }

  await apiFetch(`/api/users/${userId}`, { method: 'DELETE' });
}

export async function liveDeleteFingerprint(userId: number): Promise<AppUser> {
  const { deleteEsp32FingerprintSlot } = await import('./esp32-enroll');

  const slots = await apiFetch<FingerprintSlotRow[]>('/api/fingerprint-slots');
  const row = slots.find((s) => s.user_id === userId);
  if (row) {
    await deleteEsp32FingerprintSlot(row.slot_id);
    await apiFetch(`/api/fingerprint-slots/${row.id}`, { method: 'DELETE' });
  }
  const users = await liveGetUsers();
  const u = users.find((x) => x.id === userId);
  if (!u) throw new Error('Utilisateur introuvable');
  return u;
}
