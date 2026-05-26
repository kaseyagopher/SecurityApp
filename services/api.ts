import { USE_MOCKS } from '../config/app';
import type { AccessEvent, AlarmStatus, AppUser, AuthResponse, DoorStatus } from '../mocks/types';
import * as mock from '../mocks/api';
import type { EnrollProgress } from './esp32-enroll';

/** Couche unique : mocks aujourd'hui, backend demain */
export const api = {
  login(email: string, password: string): Promise<AuthResponse> {
    if (USE_MOCKS) return mock.mockLogin(email, password);
    return import('./api.live').then((m) => m.liveLogin(email, password));
  },

  getDoorStatus(): Promise<DoorStatus> {
    if (USE_MOCKS) return mock.mockGetDoorStatus();
    return import('./api.live').then((m) => m.liveGetDoorStatus());
  },

  getHistory(limit?: number): Promise<AccessEvent[]> {
    if (USE_MOCKS) return mock.mockGetHistory(limit);
    return import('./api.live').then((m) => m.liveGetHistory(limit));
  },

  getUsers(): Promise<AppUser[]> {
    if (USE_MOCKS) return mock.mockGetUsers();
    return import('./api.live').then((m) => m.liveGetUsers());
  },

  getAlarmStatus(): Promise<AlarmStatus> {
    if (USE_MOCKS) return mock.mockGetAlarmStatus();
    return import('./api.live').then((m) => m.liveGetAlarmStatus());
  },

  triggerAlarm(reason: string): Promise<AlarmStatus> {
    if (USE_MOCKS) return mock.mockTriggerAlarm(reason);
    return import('./api.live').then((m) => m.liveTriggerAlarm(reason));
  },

  stopAlarm(): Promise<AlarmStatus> {
    if (USE_MOCKS) return mock.mockStopAlarm();
    return import('./api.live').then((m) => m.liveStopAlarm());
  },

  remoteOpen(userName: string): Promise<DoorStatus> {
    if (USE_MOCKS) return mock.mockRemoteOpen(userName);
    return import('./api.live').then((m) => m.liveRemoteOpen(userName));
  },

  simulateDoorAccess(success: boolean, userName: string | null): Promise<DoorStatus> {
    if (USE_MOCKS) return mock.mockSimulateDoorAccess(success, userName);
    return import('./api.live').then((m) => m.liveSimulateDoorAccess(success, userName));
  },

  createUser(data: { name: string }): Promise<AppUser> {
    if (USE_MOCKS) return mock.mockCreateUser(data);
    return import('./api.live').then((m) => m.liveCreateUser(data));
  },

  setUserAuthorized(userId: number, authorized: boolean): Promise<AppUser[]> {
    if (USE_MOCKS) return mock.mockSetUserAuthorized(userId, authorized);
    return import('./api.live').then((m) => m.liveSetUserAuthorized(userId, authorized));
  },

  enrollFingerprint(userId: number, onProgress?: (p: EnrollProgress) => void): Promise<AppUser> {
    if (USE_MOCKS) return mock.mockEnrollFingerprint(userId);
    return import('./api.live').then((m) => m.liveEnrollFingerprint(userId, onProgress));
  },

  deleteFingerprint(userId: number): Promise<AppUser> {
    if (USE_MOCKS) return mock.mockDeleteFingerprint(userId);
    return import('./api.live').then((m) => m.liveDeleteFingerprint(userId));
  },

  deleteUser(userId: number): Promise<void> {
    if (USE_MOCKS) return mock.mockDeleteUser(userId);
    return import('./api.live').then((m) => m.liveDeleteUser(userId));
  },
};
