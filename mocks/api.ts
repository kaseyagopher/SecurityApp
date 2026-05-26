import { MOCK_DELAY_MS } from '../config/app';
import {
  getNextFingerprintSlot,
  getNextUserId,
  mockAlarm,
  mockDoorStatus,
  mockHistory,
  mockUsers,
  MOCK_CREDENTIALS,
  pushHistory,
  setMockUsers,
  updateMockDoorStatus,
} from './data';
import type { AccessEvent, AlarmStatus, AppUser, AuthResponse, DoorStatus, User } from './types';

const delay = (ms = MOCK_DELAY_MS) => new Promise((r) => setTimeout(r, ms));

export async function mockLogin(email: string, password: string): Promise<AuthResponse> {
  await delay();
  const key = email.trim().toLowerCase();
  const cred = MOCK_CREDENTIALS[key];
  if (!cred || cred.password !== password) {
    throw new Error('Identifiants incorrects');
  }
  if (cred.user.role !== 'admin') {
    throw new Error("Seul le compte administrateur peut utiliser l'application");
  }
  return { token: `mock-token-${cred.user.id}`, user: cred.user };
}

export async function mockGetDoorStatus(): Promise<DoorStatus> {
  await delay(200);
  return { ...mockDoorStatus, devices: { ...mockDoorStatus.devices } };
}

export async function mockGetHistory(limit = 50): Promise<AccessEvent[]> {
  await delay();
  return mockHistory.slice(0, limit);
}

export async function mockGetUsers(): Promise<AppUser[]> {
  await delay();
  return mockUsers.map((u) => ({ ...u }));
}

export async function mockGetAlarmStatus(): Promise<AlarmStatus> {
  await delay(150);
  return { ...mockAlarm };
}

export async function mockTriggerAlarm(reason: string): Promise<AlarmStatus> {
  await delay();
  mockAlarm.active = true;
  mockAlarm.triggeredAt = new Date().toISOString();
  mockAlarm.reason = reason;
  pushHistory({
    event_type: 'alarm',
    result: 'triggered',
    method: 'Application',
    userName: 'Administrateur',
    details: reason,
    created_at: new Date().toISOString(),
  });
  return { ...mockAlarm };
}

export async function mockStopAlarm(): Promise<AlarmStatus> {
  await delay();
  mockAlarm.active = false;
  pushHistory({
    event_type: 'alarm',
    result: 'stopped',
    method: 'Application',
    userName: 'Administrateur',
    details: null,
    created_at: new Date().toISOString(),
  });
  return { ...mockAlarm };
}

/** Ouverture à distance (admin) — mock */
export async function mockRemoteOpen(userName: string): Promise<DoorStatus> {
  await delay(600);
  mockDoorStatus.state = 'unlocking';
  await delay(800);
  mockDoorStatus.state = 'unlocked';
  const now = new Date().toISOString();
  mockDoorStatus.lastAccessAt = now;
  mockDoorStatus.lastAccessBy = userName;
  pushHistory({
    event_type: 'door_open',
    result: 'success',
    method: 'Ouverture à distance (app)',
    userName,
    details: 'Action admin',
    created_at: now,
  });
  await delay(2000);
  mockDoorStatus.state = 'locked';
  return mockGetDoorStatus();
}

export async function mockSimulateDoorAccess(success: boolean, userName: string | null) {
  await delay(500);
  const now = new Date().toISOString();
  if (success && userName) {
    mockDoorStatus.state = 'unlocking';
    await delay(400);
    mockDoorStatus.state = 'unlocked';
    mockDoorStatus.lastAccessAt = now;
    mockDoorStatus.lastAccessBy = userName;
    pushHistory({
      event_type: 'door_open',
      result: 'success',
      method: 'Capteur empreinte (porte)',
      userName,
      details: null,
      created_at: now,
    });
    await delay(2500);
    mockDoorStatus.state = 'locked';
  } else {
    pushHistory({
      event_type: 'door_denied',
      result: 'refused',
      method: 'Capteur empreinte (porte)',
      userName: null,
      details: 'Empreinte inconnue',
      created_at: now,
    });
  }
  return mockGetDoorStatus();
}

export async function mockCreateUser(data: { name: string }): Promise<AppUser> {
  await delay();
  const slug = data.name.trim().toLowerCase().replace(/\s+/g, '-').slice(0, 20);
  const user: AppUser = {
    id: getNextUserId(),
    email: `resident-${Date.now()}-${slug}@securityapp.local`,
    name: data.name.trim(),
    role: 'user',
    isAuthorized: false,
    fingerprintSlot: null,
    fingerprintEnrolledAt: null,
  };
  setMockUsers([...mockUsers, user]);
  return user;
}

export async function mockDeleteUser(userId: number): Promise<void> {
  await delay();
  const target = mockUsers.find((u) => u.id === userId);
  if (!target) throw new Error('Personne introuvable');
  if (target.role === 'admin') throw new Error('Impossible de supprimer un administrateur');
  setMockUsers(mockUsers.filter((u) => u.id !== userId));
}

export async function mockSetUserAuthorized(userId: number, authorized: boolean): Promise<AppUser[]> {
  await delay();
  setMockUsers(mockUsers.map((u) => (u.id === userId ? { ...u, isAuthorized: authorized } : u)));
  return mockGetUsers();
}

export async function mockEnrollFingerprint(userId: number): Promise<AppUser> {
  await delay(1200);
  const slot = getNextFingerprintSlot();
  const now = new Date().toISOString();
  setMockUsers(
    mockUsers.map((u) =>
      u.id === userId
        ? { ...u, fingerprintSlot: slot, fingerprintEnrolledAt: now, isAuthorized: true }
        : u
    )
  );
  updateMockDoorStatus({
    enrolledTemplates: mockUsers.filter((u) => u.fingerprintSlot != null).length,
  });
  const user = mockUsers.find((u) => u.id === userId)!;
  pushHistory({
    event_type: 'enrollment',
    result: 'success',
    method: 'Capteur empreinte (porte)',
    userName: user.name,
    details: `Slot #${slot} créé`,
    created_at: now,
  });
  return user;
}

export async function mockDeleteFingerprint(userId: number): Promise<AppUser> {
  await delay();
  setMockUsers(
    mockUsers.map((u) =>
      u.id === userId ? { ...u, fingerprintSlot: null, fingerprintEnrolledAt: null } : u
    )
  );
  updateMockDoorStatus({
    enrolledTemplates: mockUsers.filter((u) => u.fingerprintSlot != null).length,
  });
  return mockUsers.find((u) => u.id === userId)!;
}
