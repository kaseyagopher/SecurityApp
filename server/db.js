import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createDatabase } from './lib/sqlite.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, 'security.db');
export const db = await createDatabase(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS authorized_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
  );

  CREATE TABLE IF NOT EXISTS history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    event_type TEXT NOT NULL,
    result TEXT NOT NULL,
    details TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS entry_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    visitor_name TEXT,
    visitor_phone TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    responded_by INTEGER REFERENCES users(id),
    responded_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS fingerprint_slots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slot_id INTEGER NOT NULL UNIQUE CHECK(slot_id >= 1 AND slot_id <= 127),
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    label TEXT,
    active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0, 1)),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_fingerprint_slots_active ON fingerprint_slots(active);
  CREATE INDEX IF NOT EXISTS idx_history_created ON history(created_at DESC);
`);

function ensureHistoryColumn(name, ddl) {
  const cols = db.prepare('PRAGMA table_info(history)').all();
  if (!cols.some((c) => c.name === name)) {
    db.exec(`ALTER TABLE history ADD COLUMN ${name} ${ddl}`);
  }
}

ensureHistoryColumn('fingerprint_slot', 'INTEGER');
ensureHistoryColumn('source', "TEXT DEFAULT 'app'");
ensureHistoryColumn('method', 'TEXT');
ensureHistoryColumn('confidence', 'INTEGER');

const count = db.prepare('SELECT COUNT(*) as c FROM users').get();
if (count.c === 0) {
  const hash = bcrypt.hashSync('Admin123!', 10);
  db.prepare('INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)')
    .run('admin@securityapp.local', hash, 'Administrateur', 'admin');
  const userHash = bcrypt.hashSync('User123!', 10);
  db.prepare('INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)')
    .run('marie@demo.local', userHash, 'Marie Dupont', 'user');
  console.log('Comptes demo : admin@securityapp.local / Admin123! , marie@demo.local / User123!');
}

const fpCount = db.prepare('SELECT COUNT(*) as c FROM fingerprint_slots').get();
if (fpCount.c === 0) {
  const marie = db.prepare('SELECT id FROM users WHERE email = ?').get('marie@demo.local');
  if (marie) {
    db.prepare('INSERT INTO fingerprint_slots (slot_id, user_id, label) VALUES (?, ?, ?)').run(
      1,
      marie.id,
      'Empreinte porte — Marie'
    );
    db.prepare('INSERT OR IGNORE INTO authorized_users (user_id) VALUES (?)').run(marie.id);
    console.log('Slot demo : #1 -> marie@demo.local (adapter si votre empreinte est ailleurs)');
  }
}

export default db;
