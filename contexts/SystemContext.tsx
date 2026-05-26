import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { AccessEvent, AlarmStatus, DoorStatus } from '../mocks/types';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

type RefreshOptions = { silent?: boolean };

type SystemContextType = {
  door: DoorStatus | null;
  alarm: AlarmStatus | null;
  history: AccessEvent[];
  /** Vrai uniquement au premier chargement (évite de masquer le contenu). */
  loading: boolean;
  refresh: (options?: RefreshOptions) => Promise<void>;
  remoteOpen: () => Promise<void>;
  triggerAlarm: () => Promise<void>;
  stopAlarm: () => Promise<void>;
  simulateAccess: (success: boolean, userName: string | null) => Promise<void>;
};

const SystemContext = createContext<SystemContextType | null>(null);

const POLL_IDLE_MS = 20000;
const POLL_ALARM_MS = 10000;

export function SystemProvider({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuth();
  const [door, setDoor] = useState<DoorStatus | null>(null);
  const [alarm, setAlarm] = useState<AlarmStatus | null>(null);
  const [history, setHistory] = useState<AccessEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const hasLoadedRef = useRef(false);

  const refresh = useCallback(
    async (options?: RefreshOptions) => {
      if (!token) return;
      const silent = options?.silent ?? hasLoadedRef.current;
      if (!silent) setLoading(true);
      try {
        const [d, a, h] = await Promise.all([
          api.getDoorStatus(),
          api.getAlarmStatus(),
          api.getHistory(50),
        ]);
        setDoor(d);
        setAlarm(a);
        setHistory(h);
        hasLoadedRef.current = true;
      } catch (e) {
        console.warn('[SecurityApp] refresh:', e instanceof Error ? e.message : e);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    if (token) {
      hasLoadedRef.current = false;
      refresh({ silent: false });
    } else {
      hasLoadedRef.current = false;
      setDoor(null);
      setAlarm(null);
      setHistory([]);
      setLoading(false);
    }
  }, [token, refresh]);

  useEffect(() => {
    if (!token) return;
    const ms = alarm?.active ? POLL_ALARM_MS : POLL_IDLE_MS;
    const id = setInterval(() => refresh({ silent: true }), ms);
    return () => clearInterval(id);
  }, [token, refresh, alarm?.active]);

  const remoteOpen = useCallback(async () => {
    if (!user) return;
    const d = await api.remoteOpen(user.name);
    setDoor(d);
    const h = await api.getHistory(50);
    setHistory(h);
  }, [user]);

  const triggerAlarm = useCallback(async () => {
    const a = await api.triggerAlarm('Déclenchement manuel');
    setAlarm(a);
    const h = await api.getHistory(50);
    setHistory(h);
  }, []);

  const stopAlarm = useCallback(async () => {
    const a = await api.stopAlarm();
    setAlarm(a);
    const h = await api.getHistory(50);
    setHistory(h);
  }, []);

  const simulateAccess = useCallback(async (success: boolean, userName: string | null) => {
    const d = await api.simulateDoorAccess(success, userName);
    setDoor(d);
    const h = await api.getHistory(50);
    setHistory(h);
  }, []);

  return (
    <SystemContext.Provider
      value={{
        door,
        alarm,
        history,
        loading,
        refresh,
        remoteOpen,
        triggerAlarm,
        stopAlarm,
        simulateAccess,
      }}
    >
      {children}
    </SystemContext.Provider>
  );
}

export function useSystem() {
  const ctx = useContext(SystemContext);
  if (!ctx) throw new Error('useSystem must be used within SystemProvider');
  return ctx;
}
