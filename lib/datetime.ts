/**
 * Le serveur SQLite stocke CURRENT_TIMESTAMP en UTC (sans suffixe Z).
 * Sans conversion, l'app affiche l'heure UTC comme heure locale → décalage (ex. −2 h en France).
 */
export function parseServerDate(value: string | null | undefined): Date {
  if (!value) return new Date();
  const s = value.trim();
  if (/Z$|[+-]\d{2}:?\d{2}$/.test(s)) return new Date(s);
  const iso = s.includes('T') ? s : s.replace(' ', 'T');
  return new Date(`${iso}Z`);
}
