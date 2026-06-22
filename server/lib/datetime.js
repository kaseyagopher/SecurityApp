/** SQLite CURRENT_TIMESTAMP → UTC sans suffixe ; normaliser pour les clients */
export function sqliteUtcToIso(value) {
  if (!value || typeof value !== 'string') return value;
  const s = value.trim();
  if (!s) return value;
  if (/Z$|[+-]\d{2}:?\d{2}$/.test(s)) return s;
  const iso = s.includes('T') ? s : s.replace(' ', 'T');
  return `${iso}Z`;
}
