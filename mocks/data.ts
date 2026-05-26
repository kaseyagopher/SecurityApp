import type { AccessEvent, AlarmStatus, AppUser, DoorStatus, User } from './types';

export const MOCK_ADMIN: User = {
  id: 1,
  email: 'admin@securityapp.local',
  name: 'Administrateur',
  role: 'admin',
};

export const MOCK_USER: User = {
  id: 2,
  email: 'marie@demo.local',
  name: 'Marie Dupont',
  role: 'user',
};

export const MOCK_CREDENTIALS: Record<string, { password: string; user: User }> = {
  'admin@securityapp.local': { password: 'Admin123!', user: MOCK_ADMIN },
  'marie@demo.local': { password: 'User123!', user: MOCK_USER },
};

export let mockDoorStatus: DoorStatus = {
  state: 'locked',
  lastAccessAt: new Date(Date.now() - 1000 * 60 * 47).toISOString(),
  lastAccessBy: 'Marie Dupont',
  devices: {
    esp32: 'online',
    fingerprintSensor: 'online',
    server: 'online',
  },
  enrolledTemplates: 2,
  capacity: 127,
};

export let mockAlarm: AlarmStatus = {
  active: false,
  triggeredAt: null,
  reason: null,
};

export let mockUsers: AppUser[] = [
  {
    ...MOCK_ADMIN,
    isAuthorized: true,
    fingerprintSlot: 1,
    fingerprintEnrolledAt: '2026-05-10T09:00:00.000Z',
  },
  {
    ...MOCK_USER,
    isAuthorized: true,
    fingerprintSlot: 2,
    fingerprintEnrolledAt: '2026-05-12T14:30:00.000Z',
  },
  {
    id: 3,
    email: 'jean@demo.local',
    name: 'Jean Martin',
    role: 'user',
    isAuthorized: true,
    fingerprintSlot: null,
    fingerprintEnrolledAt: null,
  },
  {
    id: 4,
    email: 'sophie@demo.local',
    name: 'Sophie Bernard',
    role: 'user',
    isAuthorized: false,
    fingerprintSlot: null,
    fingerprintEnrolledAt: null,
  },
];

export let mockHistory: AccessEvent[] = [
  {
    id: 1,
    event_type: 'door_open',
    result: 'success',
    method: 'Capteur empreinte (porte)',
    userName: 'Marie Dupont',
    details: 'Slot #2',
    created_at: new Date(Date.now() - 1000 * 60 * 47).toISOString(),
  },
  {
    id: 2,
    event_type: 'door_denied',
    result: 'refused',
    method: 'Capteur empreinte (porte)',
    userName: null,
    details: 'Empreinte inconnue',
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    id: 3,
    event_type: 'door_open',
    result: 'success',
    method: 'Capteur empreinte (porte)',
    userName: 'Administrateur',
    details: 'Slot #1',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: 4,
    event_type: 'alarm',
    result: 'triggered',
    method: 'Automatique',
    userName: null,
    details: '3 tentatives refusées',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
  },
  {
    id: 5,
    event_type: 'alarm',
    result: 'stopped',
    method: 'Application',
    userName: 'Administrateur',
    details: null,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 25.5).toISOString(),
  },
  {
    id: 6,
    event_type: 'enrollment',
    result: 'success',
    method: 'Capteur empreinte (porte)',
    userName: 'Marie Dupont',
    details: 'Slot #2 créé',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
];

let nextHistoryId = 10;
let nextUserId = 5;

export function pushHistory(event: Omit<AccessEvent, 'id'>) {
  const entry: AccessEvent = { ...event, id: nextHistoryId++ };
  mockHistory = [entry, ...mockHistory];
  return entry;
}

export function getNextFingerprintSlot(): number {
  const used = mockUsers.map((u) => u.fingerprintSlot).filter((s): s is number => s != null);
  for (let i = 1; i <= mockDoorStatus.capacity; i++) {
    if (!used.includes(i)) return i;
  }
  return used.length + 1;
}

export function getNextUserId() {
  return nextUserId++;
}

export function setMockUsers(users: AppUser[]) {
  mockUsers = users;
}

export function updateMockDoorStatus(patch: Partial<DoorStatus>) {
  mockDoorStatus = { ...mockDoorStatus, ...patch };
}
