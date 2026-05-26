import { ESP32_CONFIG, getEsp32Url } from '../config/esp32';

export type EnrollProgress = {
  phase: string;
  message: string;
  slot_id: number;
  attempt?: number;
  templates?: number;
};

async function esp32Fetch<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ESP32_CONFIG.timeout);
  try {
    const res = await fetch(getEsp32Url(path), { ...init, signal: controller.signal });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg =
        typeof data === 'object' && data && 'error' in data
          ? String((data as { error: string }).error)
          : `ESP32 erreur ${res.status}`;
      throw new Error(msg);
    }
    return data as T;
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      throw new Error('ESP32 injoignable (timeout)');
    }
    throw e;
  } finally {
    clearTimeout(timeout);
  }
}

export async function startEsp32Enrollment(slotId: number): Promise<void> {
  await esp32Fetch('/fingerprint/enroll', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slot_id: slotId }),
  });
}

export async function getEsp32EnrollStatus(): Promise<EnrollProgress> {
  return esp32Fetch<EnrollProgress>('/fingerprint/enroll/status');
}

export async function cancelEsp32Enrollment(): Promise<void> {
  await esp32Fetch('/fingerprint/enroll/cancel', { method: 'POST' });
}

export async function deleteEsp32FingerprintSlot(slotId: number): Promise<void> {
  await esp32Fetch('/fingerprint/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slot_id: slotId }),
  });
}

const PHASE_LABELS: Record<string, string> = {
  wait_finger1: '1er scan — posez le doigt',
  wait_lift: 'Retirez le doigt',
  wait_finger2: '2e scan — même doigt',
  storing: 'Enregistrement…',
  done: 'Terminé',
  failed: 'Échec',
};

export function enrollPhaseLabel(phase: string): string {
  return PHASE_LABELS[phase] ?? phase;
}

/** Attend la fin de l’enregistrement sur le capteur (max ~2 min). */
export async function waitEsp32Enrollment(
  onProgress?: (p: EnrollProgress) => void
): Promise<void> {
  const deadline = Date.now() + 120000;
  while (Date.now() < deadline) {
    const st = await getEsp32EnrollStatus();
    onProgress?.(st);
    if (st.phase === 'done') return;
    if (st.phase === 'failed') {
      throw new Error(st.message || 'Enregistrement échoué sur le capteur');
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  await cancelEsp32Enrollment();
  throw new Error('Délai dépassé — enregistrement annulé');
}
