/**
 * URL du serveur Node — même machine que Metro (Expo Go).
 * Surcharge : EXPO_PUBLIC_API_URL=http://10.x.x.x:3001
 */
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const FALLBACK_HOST = '10.199.43.97';
const API_PORT = 3001;

function hostFromExpo(): string | null {
  const raw =
    Constants.expoGoConfig?.debuggerHost ??
    Constants.expoConfig?.hostUri ??
    null;
  if (!raw) return null;
  const cleaned = String(raw).replace(/^exp:\/\//, '').replace(/^https?:\/\//, '');
  const host = cleaned.split(':')[0]?.trim();
  if (!host) return null;
  if (host === 'localhost' || host === '127.0.0.1') return 'localhost';
  return host;
}

/** IP/port utilisés par l'app (détectés au moment de l'appel). */
export function getApiBaseUrl(): string {
  const env = process.env.EXPO_PUBLIC_API_URL;
  if (env) return env.replace(/\/$/, '');

  // Émulateur Android → PC hôte
  if (Platform.OS === 'android' && Constants.isDevice === false) {
    return `http://10.0.2.2:${API_PORT}`;
  }

  const expoHost = hostFromExpo();
  if (expoHost) return `http://${expoHost}:${API_PORT}`;

  return `http://${FALLBACK_HOST}:${API_PORT}`;
}

export const API_CONFIG = {
  get baseUrl() {
    return getApiBaseUrl();
  },
  timeout: 20000,
};

export function apiUrl(path: string): string {
  const base = getApiBaseUrl();
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}
