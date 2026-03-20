/**
 * Configuration API backend (Node.js)
 * Sur téléphone physique : utilisez l'IP de votre machine (ex: 192.168.1.x)
 */
const getBaseUrl = () => {
  return 'http://10.73.133.108:3001';
};

export const API_CONFIG = {
  baseUrl: getBaseUrl(),
  timeout: 10000,
};

export function apiUrl(path: string): string {
  const base = API_CONFIG.baseUrl.replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}
