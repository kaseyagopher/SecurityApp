import { apiFetch } from '../lib/api-client';

export type EnrollProgress = {
  phase: string;
  message: string;
  slot_id: number;
  attempt?: number;
  templates?: number;
};

async function esp32Fetch<T>(path: string, init?: RequestInit): Promise<T> {
  return apiFetch<T>(`/api/esp32${path}`, init);
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

export async function syncEsp32Slots(): Promise<void> {
  await esp32Fetch('/sync-slots', { method: 'POST' });
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
