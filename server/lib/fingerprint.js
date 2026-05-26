import { db } from '../db.js';

export function getActiveAuthorizedSlotIds() {
  const rows = db
    .prepare('SELECT slot_id FROM fingerprint_slots WHERE active = 1 ORDER BY slot_id')
    .all();
  return rows.map((r) => r.slot_id);
}

export function findSlotBySlotId(slotId) {
  return db
    .prepare(`
      SELECT fs.*, u.name, u.email
      FROM fingerprint_slots fs
      JOIN users u ON u.id = fs.user_id
      WHERE fs.slot_id = ? AND fs.active = 1
    `)
    .get(slotId);
}

export function listFingerprintSlots() {
  return db
    .prepare(`
      SELECT fs.id, fs.slot_id, fs.user_id, fs.label, fs.active,
             fs.created_at, fs.updated_at,
             u.name, u.email
      FROM fingerprint_slots fs
      JOIN users u ON u.id = fs.user_id
      ORDER BY fs.slot_id
    `)
    .all();
}

export function ensureUserAuthorized(userId) {
  db.prepare('INSERT OR IGNORE INTO authorized_users (user_id) VALUES (?)').run(userId);
}

export function touchSlotUpdated(slotId) {
  db.prepare(
    'UPDATE fingerprint_slots SET updated_at = CURRENT_TIMESTAMP WHERE slot_id = ?'
  ).run(slotId);
}
