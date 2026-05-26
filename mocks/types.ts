export type UserRole = 'admin' | 'user';

export type User = {
  id: number;
  email: string;
  name: string;
  role: UserRole;
};

export type DoorState = 'locked' | 'unlocking' | 'unlocked';

export type DeviceStatus = 'online' | 'offline' | 'degraded';

export type SystemDevices = {
  esp32: DeviceStatus;
  fingerprintSensor: DeviceStatus;
  server: DeviceStatus;
};

export type DoorStatus = {
  state: DoorState;
  lastAccessAt: string | null;
  lastAccessBy: string | null;
  devices: SystemDevices;
  enrolledTemplates: number;
  capacity: number;
};

export type AccessEventType = 'door_open' | 'door_denied' | 'alarm' | 'enrollment';

export type AccessEvent = {
  id: number;
  event_type: AccessEventType;
  result: 'success' | 'refused' | 'error' | 'triggered' | 'stopped';
  method: string;
  userName: string | null;
  details: string | null;
  created_at: string;
};

export type AppUser = User & {
  isAuthorized: boolean;
  fingerprintSlot: number | null;
  fingerprintEnrolledAt: string | null;
};

export type AlarmStatus = {
  active: boolean;
  triggeredAt: string | null;
  reason: string | null;
};

export type AuthResponse = {
  token: string;
  user: User;
};
