/** Déconnexion quand le serveur renvoie 401 (ancien token après clone / nouveau JWT_SECRET). */
let onExpired: (() => void) | null = null;

export function setSessionExpiredHandler(handler: () => void) {
  onExpired = handler;
}

export function notifySessionExpired() {
  onExpired?.();
}
