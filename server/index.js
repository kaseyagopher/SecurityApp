import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from './db.js';

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'securityapp-secret-change-in-prod';
const ESP32_URL = process.env.ESP32_URL || 'http://10.73.133.47';
const MAX_FAILED_ATTEMPTS = 3;

// Compteur de tentatives refusées par utilisateur (reset sur succès ou après 5 min)
const failedAttempts = new Map(); // userId -> { count, lastAt }
const FAILED_WINDOW_MS = 5 * 60 * 1000;

function triggerEsp32Alarm() {
  const url = `${ESP32_URL.replace(/\/$/, '')}/alarm`;
  return fetch(url, { method: 'POST' }).catch(() => null);
}

function recordFailedAttempt(userId) {
  const now = Date.now();
  let entry = failedAttempts.get(userId);
  if (!entry) entry = { count: 0, lastAt: 0 };
  if (now - entry.lastAt > FAILED_WINDOW_MS) entry.count = 0;
  entry.count++;
  entry.lastAt = now;
  failedAttempts.set(userId, entry);
  return entry.count;
}

function resetFailedAttempts(userId) {
  failedAttempts.delete(userId);
}

app.use(cors());
app.use(express.json());

// Middleware auth
function auth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Non autorisé' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token invalide ou expiré' });
  }
}

function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
  next();
}

// ---- Auth ----
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis' });
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.password))
    return res.status(401).json({ error: 'Identifiants incorrects' });
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
});

// ---- Utilisateurs (admin) ----
app.get('/api/users', auth, adminOnly, (req, res) => {
  const rows = db.prepare(`
    SELECT u.id, u.email, u.name, u.role, u.created_at,
           EXISTS(SELECT 1 FROM authorized_users a WHERE a.user_id = u.id) as is_authorized
    FROM users u
    ORDER BY u.name
  `).all();
  res.json(rows);
});

app.post('/api/users', auth, adminOnly, (req, res) => {
  const { email, password, name } = req.body || {};
  if (!email || !password || !name)
    return res.status(400).json({ error: 'Email, mot de passe et nom requis' });
  const hash = bcrypt.hashSync(password, 10);
  try {
    const r = db.prepare('INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)')
      .run(email.toLowerCase(), hash, name, 'user');
    res.status(201).json({ id: r.lastInsertRowid, email, name });
  } catch (e) {
    if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') return res.status(409).json({ error: 'Cet email existe déjà' });
    throw e;
  }
});

app.delete('/api/users/:id', auth, adminOnly, (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'ID invalide' });
  const u = db.prepare('SELECT role FROM users WHERE id = ?').get(id);
  if (!u) return res.status(404).json({ error: 'Utilisateur introuvable' });
  if (u.role === 'admin') return res.status(403).json({ error: 'Impossible de supprimer un admin' });
  db.prepare('DELETE FROM users WHERE id = ?').run(id);
  res.json({ ok: true });
});

// ---- Utilisateurs autorisés (accès porte) ----
app.get('/api/authorized-users', auth, adminOnly, (req, res) => {
  const rows = db.prepare(`
    SELECT u.id, u.email, u.name, a.created_at
    FROM authorized_users a
    JOIN users u ON u.id = a.user_id
    ORDER BY u.name
  `).all();
  res.json(rows);
});

app.post('/api/authorized-users', auth, adminOnly, (req, res) => {
  const userId = parseInt(req.body?.user_id, 10);
  if (isNaN(userId)) return res.status(400).json({ error: 'user_id requis' });
  try {
    db.prepare('INSERT INTO authorized_users (user_id) VALUES (?)').run(userId);
    res.status(201).json({ ok: true });
  } catch (e) {
    if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') return res.status(409).json({ error: 'Déjà autorisé' });
    throw e;
  }
});

app.delete('/api/authorized-users/:userId', auth, adminOnly, (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  if (isNaN(userId)) return res.status(400).json({ error: 'ID invalide' });
  db.prepare('DELETE FROM authorized_users WHERE user_id = ?').run(userId);
  res.json({ ok: true });
});

// ---- Ouvrir la porte (utilisateur authentifié + autorisé) ----
app.post('/api/door/open', auth, (req, res) => {
  const userId = req.user.id;
  const authRow = db.prepare('SELECT 1 FROM authorized_users WHERE user_id = ?').get(userId);
  if (!authRow) {
    db.prepare('INSERT INTO history (user_id, event_type, result, details) VALUES (?, ?, ?, ?)')
      .run(userId, 'door_open', 'refused', 'Non autorisé');
    const count = recordFailedAttempt(userId);
    if (count >= MAX_FAILED_ATTEMPTS) {
      resetFailedAttempts(userId);
      triggerEsp32Alarm();
      db.prepare('INSERT INTO history (user_id, event_type, result, details) VALUES (?, ?, ?, ?)')
        .run(userId, 'alarm', 'triggered', 'Déclenchement auto après 3 tentatives refusées');
    }
    return res.status(403).json({ error: "Vous n'êtes pas autorisé à ouvrir la porte" });
  }

  resetFailedAttempts(userId);
  const openUrl = `${ESP32_URL.replace(/\/$/, '')}/open`;

  fetch(openUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'open' }),
  }).then(r => {
    const ok = r.ok;
    db.prepare('INSERT INTO history (user_id, event_type, result, details) VALUES (?, ?, ?, ?)')
      .run(userId, 'door_open', ok ? 'success' : 'error', ok ? null : `ESP32: ${r.status}`);
    if (ok) res.json({ success: true, message: 'Porte ouverte' });
    else res.status(502).json({ error: 'ESP32 non joignable' });
  }).catch(err => {
    db.prepare('INSERT INTO history (user_id, event_type, result, details) VALUES (?, ?, ?, ?)')
      .run(userId, 'door_open', 'error', err.message);
    res.status(502).json({ error: 'ESP32 non joignable' });
  });
});

// ---- Historique ----
app.get('/api/history', auth, (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
  const rows = db.prepare(`
    SELECT h.id, h.event_type, h.result, h.details, h.created_at, u.name, u.email
    FROM history h
    LEFT JOIN users u ON u.id = h.user_id
    ORDER BY h.created_at DESC
    LIMIT ?
  `).all(limit);
  res.json(rows);
});

// ---- Demandes d'accès (visiteur) ----
app.post('/api/entry-requests', (req, res) => {
  const { visitor_name, visitor_phone } = req.body || {};
  const name = (visitor_name || '').trim() || 'Visiteur';
  db.prepare('INSERT INTO entry_requests (visitor_name, visitor_phone, status) VALUES (?, ?, ?)')
    .run(name, visitor_phone || null, 'pending');
  res.status(201).json({ ok: true, message: 'Demande envoyée' });
});

app.get('/api/entry-requests', auth, adminOnly, (req, res) => {
  const rows = db.prepare(`
    SELECT * FROM entry_requests
    WHERE status = 'pending'
    ORDER BY created_at DESC
  `).all();
  res.json(rows);
});

app.post('/api/entry-requests/:id/respond', auth, adminOnly, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { accept } = req.body || {};
  if (isNaN(id)) return res.status(400).json({ error: 'ID invalide' });
  const status = accept ? 'accepted' : 'refused';
  db.prepare(`
    UPDATE entry_requests SET status = ?, responded_by = ?, responded_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(status, req.user.id, id);
  db.prepare('INSERT INTO history (user_id, event_type, result, details) VALUES (?, ?, ?, ?)')
    .run(req.user.id, 'entry_request', status, `Demande #${id}`);
  res.json({ ok: true, status });
});

// ---- Alarme (admin) ----
app.post('/api/alarm/trigger', auth, adminOnly, (req, res) => {
  const url = `${ESP32_URL.replace(/\/$/, '')}/alarm`;
  fetch(url, { method: 'POST' }).then(r => {
    db.prepare('INSERT INTO history (user_id, event_type, result, details) VALUES (?, ?, ?, ?)')
      .run(req.user.id, 'alarm', r.ok ? 'triggered' : 'error', null);
    res.json({ success: r.ok });
  }).catch(() => {
    db.prepare('INSERT INTO history (user_id, event_type, result, details) VALUES (?, ?, ?, ?)')
      .run(req.user.id, 'alarm', 'error', 'ESP32 non joignable');
    res.status(502).json({ error: 'ESP32 non joignable' });
  });
});

app.post('/api/alarm/stop', auth, adminOnly, async (req, res) => {
  const base = ESP32_URL.replace(/\/$/, '');
  const urls = [`${base}/alarm-stop`, `${base}/alarmstop`];
  let lastErr;
  for (const url of urls) {
    try {
      const r = await fetch(url, { method: 'POST' });
      db.prepare('INSERT INTO history (user_id, event_type, result, details) VALUES (?, ?, ?, ?)')
        .run(req.user.id, 'alarm', r.ok ? 'stopped' : 'error', r.ok ? null : `ESP32: ${r.status}`);
      return res.json({ success: r.ok });
    } catch (e) {
      lastErr = e;
    }
  }
  console.error('Alarm stop ESP32 error:', lastErr?.message || lastErr);
  res.status(502).json({ error: 'ESP32 non joignable' });
});

app.get('/api/alarm/status', auth, async (req, res) => {
  try {
    const r = await fetch(`${ESP32_URL.replace(/\/$/, '')}/status`);
    const data = await r.json().catch(() => ({}));
    res.json({ alarm: data.alarm === 'active' ? 'active' : 'inactive' });
  } catch {
    res.json({ alarm: 'unknown' });
  }
});

app.listen(PORT, () => {
  console.log(`SecurityApp API sur http://localhost:${PORT}`);
});
