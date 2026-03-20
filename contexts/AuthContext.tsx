import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'securityapp_token';
const USER_KEY = 'securityapp_user';

type User = { id: number; email: string; name: string; role: string };

type AuthContextType = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadStored = useCallback(async () => {
    try {
      const [storedToken, storedUser] = await Promise.all([
        SecureStore.getItemAsync(TOKEN_KEY),
        SecureStore.getItemAsync(USER_KEY),
      ]);
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } else {
        setToken(null);
        setUser(null);
      }
    } catch {
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStored();
  }, [loadStored]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const { apiUrl } = await import('../config/api');
      const res = await fetch(apiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { ok: false, error: data.error || 'Identifiants incorrects' };
      }
      const { token: t, user: u } = data;
      await SecureStore.setItemAsync(TOKEN_KEY, t);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(u));
      setToken(t);
      setUser(u);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: 'Erreur réseau. Vérifiez que le serveur tourne.' };
    }
  }, []);

  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, refreshUser: loadStored }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
