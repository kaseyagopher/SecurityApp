import * as SecureStore from 'expo-secure-store';
import { API_CONFIG, apiUrl } from '../config/api';
import { notifySessionExpired } from './session';

export const TOKEN_KEY = 'securityapp_token';
export const USER_KEY = 'securityapp_user';

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_CONFIG.timeout);

  try {
    const res = await fetch(apiUrl(path), {
      ...options,
      headers,
      signal: controller.signal,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 401) {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        await SecureStore.deleteItemAsync(USER_KEY);
        notifySessionExpired();
      }
      const msg =
        typeof data === 'object' && data && 'error' in data
          ? String((data as { error: string }).error)
          : `Erreur ${res.status}`;
      throw new Error(msg);
    }
    return data as T;
  } catch (e) {
    const base = API_CONFIG.baseUrl;
    if (e instanceof Error && e.name === 'AbortError') {
      throw new Error(
        `Délai dépassé (${base}) — PC allumé, npm start dans server/, même Wi‑Fi, pare-feu port 3001`
      );
    }
    if (e instanceof TypeError) {
      throw new Error(
        `Réseau inaccessible : ${base} — téléphone et PC sur le même Wi‑Fi ?`
      );
    }
    throw e;
  } finally {
    clearTimeout(timeout);
  }
}
