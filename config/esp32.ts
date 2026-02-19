/**
 * Configuration de la connexion à l'ESP32 (sécurité maison).
 * Remplacez par l'adresse IP de votre ESP32 sur votre réseau WiFi.
 * L'ESP32 expose un serveur HTTP (voir dossier esp32/).
 */
export const ESP32_CONFIG = {
  /** URL de base de l'ESP32 (ex: http://192.168.1.100) */
  baseUrl: __DEV__
    ? 'http://10.73.133.47'  // En dev, changez selon votre réseau
    : 'http://192.168.1.100', // En prod, même IP ou hostname

  /** Timeout des requêtes vers l'ESP32 (ms) */
  timeout: 8000,

  /** Endpoints utilisés par l'app */
  endpoints: {
    /** Ouvrir la porte (servo + feedback LED/buzzer) */
    openDoor: '/open',
    /** État actuel (porte, alarme, etc.) */
    status: '/status',
  },
} as const;

export function getEsp32Url(path: string): string {
  const base = ESP32_CONFIG.baseUrl.replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}
