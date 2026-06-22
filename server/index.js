import bcrypt from 'bcryptjs';
import cors from 'cors';
import crypto from 'crypto';
import express from 'express';
import jwt from 'jsonwebtoken';
import os from 'os';
import { db } from './db.js';
import {
  ensureUserAuthorized,
  findSlotBySlotId,
  getActiveAuthorizedSlotIds,
  listFingerprintSlots,
} from './lib/fingerprint.js';
import { getHistoryRows, insertAccessHistory } from './lib/history.js';
import { isUniqueConstraintError } from './lib/sqlite.js';
import { esp32Auth } from './middleware/esp32-auth.js';
import { sqliteUtcToIso } from './lib/datetime.js';

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'securityapp-secret-change-in-prod';
const ESP32_URL = process.env.ESP32_URL || 'http://10.78.217.47';

const MAX_FAILED_ATTEMPTS = 3;
const failedAttempts = new Map();
const FAILED_WINDOW_MS = 5 * 60 * 1000;

function triggerEsp32Alarm() {
  const url = `${ESP32_URL.replace(/\/$/, '')}/alarm`;
  return fetch(url, { method: 'POST' }).catch(() => null);
}

function triggerEsp32SlotSync() {
  const url = `${ESP32_URL.replace(/\/$/, '')}/sync-slots`;
  return fetch(url, { method: 'POST', signal: AbortSignal.timeout(5000) }).catch(() => null);
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

function mapUserRow(row) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    created_at: sqliteUtcToIso(row.created_at),
    isAuthorized: Boolean(row.is_authorized),
    fingerprintSlot: row.fingerprint_slot ?? null,
    fingerprintEnrolledAt: sqliteUtcToIso(row.fingerprint_enrolled_at) ?? null,
  };
}

const USERS_SELECT = `
  SELECT u.id, u.email, u.name, u.role, u.created_at,
    CASE
      WHEN EXISTS(SELECT 1 FROM authorized_users a WHERE a.user_id = u.id)
        OR EXISTS(SELECT 1 FROM fingerprint_slots f WHERE f.user_id = u.id AND f.active = 1)
      THEN 1 ELSE 0
    END AS is_authorized,
    (SELECT f.slot_id FROM fingerprint_slots f WHERE f.user_id = u.id AND f.active = 1 LIMIT 1) AS fingerprint_slot,
    (SELECT f.created_at FROM fingerprint_slots f WHERE f.user_id = u.id AND f.active = 1 LIMIT 1) AS fingerprint_enrolled_at
  FROM users u
`;

app.use(cors());
app.use(express.json());

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
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
  }
  next();
}

// ---- Auth ----
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis' });
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Identifiants incorrects' });
  }
  if (user.role !== 'admin') {
    return res.status(403).json({
      error: "Seul le compte administrateur peut utiliser l'application",
    });
  }
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
});

// ---- Utilisateurs (admin) ----
app.get('/api/users', auth, adminOnly, (req, res) => {
  const rows = db.prepare(`${USERS_SELECT} ORDER BY u.name`).all();
  res.json(rows.map(mapUserRow));
});

app.post('/api/users', auth, adminOnly, (req, res) => {
  const { name, email, password } = req.body || {};
  const trimmedName = (name || '').trim();
  if (!trimmedName) {
    return res.status(400).json({ error: 'Nom requis' });
  }
  const slug = trimmedName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 24);
  const autoEmail =
    (email || '').trim().toLowerCase() ||
    `resident-${Date.now()}-${slug || 'x'}@securityapp.local`;
  const autoPassword = password || crypto.randomBytes(18).toString('base64url');
  const hash = bcrypt.hashSync(autoPassword, 10);
  try {
    const r = db.prepare('INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)')
      .run(autoEmail, hash, trimmedName, 'user');
    res.status(201).json({ id: r.lastInsertRowid, email: autoEmail, name: trimmedName });
  } catch (e) {
    if (isUniqueConstraintError(e)) {
      return res.status(409).json({ error: 'Cet email existe déjà' });
    }
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

// ---- Slots empreinte (admin) ----
app.get('/api/fingerprint-slots', auth, adminOnly, (req, res) => {
  res.json(listFingerprintSlots());
});

app.post('/api/fingerprint-slots', auth, adminOnly, (req, res) => {
  const userId = parseInt(req.body?.user_id, 10);
  const slotId = parseInt(req.body?.slot_id, 10);
  const label = (req.body?.label || '').trim() || null;
  if (isNaN(userId) || isNaN(slotId) || slotId < 1 || slotId > 127) {
    return res.status(400).json({ error: 'user_id et slot_id (1-127) requis' });
  }
  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
  try {
    const r = db
      .prepare(
        'INSERT INTO fingerprint_slots (slot_id, user_id, label) VALUES (?, ?, ?)'
      )
      .run(slotId, userId, label);
    ensureUserAuthorized(userId);
    const row = db
      .prepare(
        `SELECT fs.*, u.name, u.email FROM fingerprint_slots fs
         JOIN users u ON u.id = fs.user_id WHERE fs.id = ?`
      )
      .get(r.lastInsertRowid);
    void triggerEsp32SlotSync();
    res.status(201).json(row);
  } catch (e) {
    if (isUniqueConstraintError(e)) {
      const byUser = db
        .prepare(
          `SELECT fs.*, u.name, u.email FROM fingerprint_slots fs
           JOIN users u ON u.id = fs.user_id WHERE fs.user_id = ? LIMIT 1`
        )
        .get(userId);
      if (byUser) {
        // L'utilisateur a deja une assignation: on essaye de la basculer vers le slot demande.
        try {
          db.prepare(
            `UPDATE fingerprint_slots
             SET slot_id = ?, label = ?, active = 1, updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`
          ).run(slotId, label, byUser.id);
          const updated = db
            .prepare(
              `SELECT fs.*, u.name, u.email FROM fingerprint_slots fs
               JOIN users u ON u.id = fs.user_id WHERE fs.id = ?`
            )
            .get(byUser.id);
          void triggerEsp32SlotSync();
          return res.status(200).json(updated);
        } catch (updateErr) {
          if (isUniqueConstraintError(updateErr)) {
            return res.status(409).json({ error: `Slot #${slotId} deja assigne` });
          }
          throw updateErr;
        }
      }
      const bySlot = db
        .prepare(
          `SELECT fs.*, u.name, u.email FROM fingerprint_slots fs
           JOIN users u ON u.id = fs.user_id WHERE fs.slot_id = ? LIMIT 1`
        )
        .get(slotId);
      if (bySlot) {
        return res.status(409).json({ error: `Slot #${slotId} deja assigne` });
      }
      return res.status(409).json({ error: 'Slot ou utilisateur deja assigne' });
    }
    throw e;
  }
});

app.patch('/api/fingerprint-slots/:id', auth, adminOnly, (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'ID invalide' });
  const existing = db.prepare('SELECT * FROM fingerprint_slots WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Assignation introuvable' });

  const slotId = req.body?.slot_id != null ? parseInt(req.body.slot_id, 10) : existing.slot_id;
  const userId = req.body?.user_id != null ? parseInt(req.body.user_id, 10) : existing.user_id;
  const active = req.body?.active != null ? (req.body.active ? 1 : 0) : existing.active;
  const label = req.body?.label !== undefined ? (req.body.label || '').trim() || null : existing.label;

  if (isNaN(slotId) || slotId < 1 || slotId > 127 || isNaN(userId)) {
    return res.status(400).json({ error: 'slot_id ou user_id invalide' });
  }

  try {
    db.prepare(
      `UPDATE fingerprint_slots
       SET slot_id = ?, user_id = ?, label = ?, active = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    ).run(slotId, userId, label, active, id);
    if (active) ensureUserAuthorized(userId);
    const row = db
      .prepare(
        `SELECT fs.*, u.name, u.email FROM fingerprint_slots fs
         JOIN users u ON u.id = fs.user_id WHERE fs.id = ?`
      )
      .get(id);
    res.json(row);
  } catch (e) {
    if (isUniqueConstraintError(e)) {
      return res.status(409).json({ error: 'Slot ou utilisateur deja assigne' });
    }
    throw e;
  }
});

app.delete('/api/fingerprint-slots/:id', auth, adminOnly, (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'ID invalide' });
  const r = db.prepare('DELETE FROM fingerprint_slots WHERE id = ?').run(id);
  if (r.changes === 0) return res.status(404).json({ error: 'Assignation introuvable' });
  res.json({ ok: true });
});

// ---- ESP32 (cle X-ESP32-Key) ----
app.get('/api/esp32/authorized-slots', esp32Auth, (req, res) => {
  const slots = getActiveAuthorizedSlotIds();
  const meta = db
    .prepare('SELECT MAX(updated_at) AS updated_at FROM fingerprint_slots WHERE active = 1')
    .get();
  res.json({
    slots,
    count: slots.length,
    updated_at: meta?.updated_at ?? null,
  });
});

app.post('/api/esp32/events', esp32Auth, (req, res) => {
  const { event, slot_id, confidence, details } = req.body || {};
  const slot = slot_id != null ? parseInt(slot_id, 10) : null;
  const conf = confidence != null ? parseInt(confidence, 10) : null;

  if (!event) return res.status(400).json({ error: 'event requis' });

  switch (event) {
    case 'granted': {
      if (!slot || slot < 1) {
        return res.status(400).json({ error: 'slot_id requis pour granted' });
      }
      const mapping = findSlotBySlotId(slot);
      if (!mapping) {
        insertAccessHistory({
          eventType: 'fingerprint_denied',
          result: 'refused',
          details: details || `Slot ${slot} non configure sur le serveur`,
          fingerprintSlot: slot,
          source: 'esp32',
          confidence: conf,
        });
        return res.json({ ok: true, recorded: true, warning: 'slot_unknown_server' });
      }
      insertAccessHistory({
        userId: mapping.user_id,
        eventType: 'fingerprint_granted',
        result: 'success',
        details,
        fingerprintSlot: slot,
        source: 'esp32',
        confidence: conf,
      });
      return res.json({ ok: true, user_id: mapping.user_id, user_name: mapping.name });
    }

    case 'denied': {
      let userId = null;
      let detail = details || 'Acces refuse';
      if (slot && slot > 0) {
        const mapping = findSlotBySlotId(slot);
        const inactive = db
          .prepare('SELECT user_id FROM fingerprint_slots WHERE slot_id = ? AND active = 0')
          .get(slot);
        if (mapping) {
          userId = mapping.user_id;
          detail = details || `Empreinte connue (slot ${slot}) refusee`;
        } else if (inactive) {
          userId = inactive.user_id;
          detail = details || `Slot ${slot} desactive`;
        } else {
          detail = details || `Empreinte inconnue (lecture slot ${slot})`;
        }
      } else {
        detail = details || 'Empreinte inconnue';
      }
      insertAccessHistory({
        userId,
        eventType: 'fingerprint_denied',
        result: 'refused',
        details: detail,
        fingerprintSlot: slot && slot > 0 ? slot : null,
        source: 'esp32',
        confidence: conf,
      });
      return res.json({ ok: true });
    }

    case 'alarm':
      insertAccessHistory({
        eventType: 'alarm',
        result: 'triggered',
        details: details || 'Alarme porte',
        source: 'esp32',
        method: 'ESP32 (porte)',
      });
      return res.json({ ok: true });

    case 'alarm_stop':
      insertAccessHistory({
        eventType: 'alarm',
        result: 'stopped',
        details: details || 'Alarme arretee',
        source: 'esp32',
        method: 'ESP32 (porte)',
      });
      return res.json({ ok: true });

    case 'remote_open':
      insertAccessHistory({
        eventType: 'door_open',
        result: 'success',
        details: details || 'Ouverture HTTP ESP32',
        source: 'esp32',
        method: 'ESP32 (HTTP)',
      });
      return res.json({ ok: true });

    default:
      return res.status(400).json({
        error: 'event invalide',
        allowed: ['granted', 'denied', 'alarm', 'alarm_stop', 'remote_open'],
      });
  }
});

// ---- Utilisateurs autorisés (ouverture app / distance) ----
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
    if (isUniqueConstraintError(e)) {
      return res.status(409).json({ error: 'Déjà autorisé' });
    }
    throw e;
  }
});

app.delete('/api/authorized-users/:userId', auth, adminOnly, (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  if (isNaN(userId)) return res.status(400).json({ error: 'ID invalide' });
  db.prepare('DELETE FROM authorized_users WHERE user_id = ?').run(userId);
  res.json({ ok: true });
});

// ---- Porte ----
app.get('/api/door/status', auth, async (req, res) => {
  const authorizedSlots = getActiveAuthorizedSlotIds();
  let esp = null;
  let esp32Online = false;
  try {
    const r = await fetch(`${ESP32_URL.replace(/\/$/, '')}/status`, {
      signal: AbortSignal.timeout(4000),
    });
    if (r.ok) {
      esp = await r.json();
      esp32Online = true;
    }
  } catch {
    /* ESP32 hors ligne */
  }

  res.json({
    state: 'locked',
    door: esp?.door ?? 'locked',
    alarm: esp?.alarm === 'active' ? 'active' : esp?.alarm === 'inactive' ? 'inactive' : 'unknown',
    fingerprint: esp?.fingerprint ?? 'offline',
    templates: esp?.templates ?? 0,
    capacity: 128,
    last_slot: esp?.last_slot ?? 0,
    last_event: esp?.last_event ?? null,
    failed_attempts: esp?.failed_attempts ?? 0,
    authorized_slots: authorizedSlots,
    esp32_online: esp32Online,
    esp32_url: ESP32_URL,
  });
});

app.post('/api/door/open', auth, (req, res) => {
  const userId = req.user.id;
  const isAdmin = req.user.role === 'admin';
  const authRow = isAdmin
    ? { ok: 1 }
    : db
        .prepare(
          `
    SELECT 1 FROM authorized_users WHERE user_id = ?
    UNION SELECT 1 FROM fingerprint_slots WHERE user_id = ? AND active = 1
  `
        )
        .get(userId, userId);

  if (!authRow) {
    insertAccessHistory({
      userId,
      eventType: 'door_open',
      result: 'refused',
      details: 'Non autorisé',
      source: 'app',
    });
    const count = recordFailedAttempt(userId);
    if (count >= MAX_FAILED_ATTEMPTS) {
      resetFailedAttempts(userId);
      triggerEsp32Alarm();
      insertAccessHistory({
        userId,
        eventType: 'alarm',
        result: 'triggered',
        details: 'Déclenchement auto après 3 tentatives refusées',
        source: 'app',
      });
    }
    return res.status(403).json({ error: "Vous n'êtes pas autorisé à ouvrir la porte" });
  }

  resetFailedAttempts(userId);
  const openUrl = `${ESP32_URL.replace(/\/$/, '')}/open`;

  fetch(openUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'open' }),
  })
    .then((r) => {
      const ok = r.ok;
      insertAccessHistory({
        userId,
        eventType: 'door_open',
        result: ok ? 'success' : 'error',
        details: ok ? null : `ESP32: ${r.status}`,
        source: 'remote',
        method: 'Application (distance)',
      });
      if (ok) res.json({ success: true, message: 'Porte ouverte' });
      else res.status(502).json({ error: 'ESP32 non joignable' });
    })
    .catch((err) => {
      insertAccessHistory({
        userId,
        eventType: 'door_open',
        result: 'error',
        details: err.message,
        source: 'remote',
      });
      res.status(502).json({ error: 'ESP32 non joignable' });
    });
});

// ---- Proxy admin vers ESP32 (enrôlement/suppression empreinte) ----
app.post('/api/esp32/fingerprint/enroll', auth, adminOnly, async (req, res) => {
  const base = ESP32_URL.replace(/\/$/, '');
  const slotId = parseInt(req.body?.slot_id, 10);
  if (isNaN(slotId) || slotId < 1 || slotId > 127) {
    return res.status(400).json({ error: 'slot_id requis (1-127)' });
  }
  try {
    const r = await fetch(`${base}/fingerprint/enroll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slot_id: slotId }),
      signal: AbortSignal.timeout(6000),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) return res.status(502).json({ error: data?.error || `ESP32 erreur ${r.status}` });
    return res.json(data);
  } catch (e) {
    return res
      .status(502)
      .json({ error: e instanceof Error ? e.message : 'ESP32 non joignable' });
  }
});

app.get('/api/esp32/fingerprint/enroll/status', auth, adminOnly, async (_req, res) => {
  const base = ESP32_URL.replace(/\/$/, '');
  try {
    const r = await fetch(`${base}/fingerprint/enroll/status`, {
      signal: AbortSignal.timeout(6000),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) return res.status(502).json({ error: data?.error || `ESP32 erreur ${r.status}` });
    return res.json(data);
  } catch (e) {
    return res
      .status(502)
      .json({ error: e instanceof Error ? e.message : 'ESP32 non joignable' });
  }
});

app.post('/api/esp32/fingerprint/enroll/cancel', auth, adminOnly, async (_req, res) => {
  const base = ESP32_URL.replace(/\/$/, '');
  try {
    const r = await fetch(`${base}/fingerprint/enroll/cancel`, {
      method: 'POST',
      signal: AbortSignal.timeout(6000),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) return res.status(502).json({ error: data?.error || `ESP32 erreur ${r.status}` });
    return res.json(data);
  } catch (e) {
    return res
      .status(502)
      .json({ error: e instanceof Error ? e.message : 'ESP32 non joignable' });
  }
});

app.post('/api/esp32/fingerprint/delete', auth, adminOnly, async (req, res) => {
  const base = ESP32_URL.replace(/\/$/, '');
  const slotId = parseInt(req.body?.slot_id, 10);
  if (isNaN(slotId) || slotId < 1 || slotId > 127) {
    return res.status(400).json({ error: 'slot_id requis (1-127)' });
  }
  try {
    const r = await fetch(`${base}/fingerprint/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slot_id: slotId }),
      signal: AbortSignal.timeout(6000),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) return res.status(502).json({ error: data?.error || `ESP32 erreur ${r.status}` });
    return res.json(data);
  } catch (e) {
    return res
      .status(502)
      .json({ error: e instanceof Error ? e.message : 'ESP32 non joignable' });
  }
});

app.post('/api/esp32/sync-slots', auth, adminOnly, async (_req, res) => {
  const base = ESP32_URL.replace(/\/$/, '');
  try {
    const r = await fetch(`${base}/sync-slots`, {
      method: 'POST',
      signal: AbortSignal.timeout(6000),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) return res.status(502).json({ error: data?.error || `ESP32 erreur ${r.status}` });
    return res.json(data);
  } catch (e) {
    return res
      .status(502)
      .json({ error: e instanceof Error ? e.message : 'ESP32 non joignable' });
  }
});

// ---- Historique ----
app.get('/api/history', auth, (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
  res.json(getHistoryRows(limit));
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
  const rows = db
    .prepare(`SELECT * FROM entry_requests WHERE status = 'pending' ORDER BY created_at DESC`)
    .all();
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
  insertAccessHistory({
    userId: req.user.id,
    eventType: 'entry_request',
    result: status,
    details: `Demande #${id}`,
    source: 'app',
  });
  res.json({ ok: true, status });
});

// ---- Alarme (admin) ----
app.post('/api/alarm/trigger', auth, adminOnly, (req, res) => {
  const reason = req.body?.reason || 'Manuel (application)';
  const url = `${ESP32_URL.replace(/\/$/, '')}/alarm`;
  fetch(url, { method: 'POST' })
    .then((r) => {
      insertAccessHistory({
        userId: req.user.id,
        eventType: 'alarm',
        result: r.ok ? 'triggered' : 'error',
        details: reason,
        source: 'app',
      });
      res.json({ success: r.ok });
    })
    .catch(() => {
      insertAccessHistory({
        userId: req.user.id,
        eventType: 'alarm',
        result: 'error',
        details: 'ESP32 non joignable',
        source: 'app',
      });
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
      insertAccessHistory({
        userId: req.user.id,
        eventType: 'alarm',
        result: r.ok ? 'stopped' : 'error',
        details: r.ok ? null : `ESP32: ${r.status}`,
        source: 'app',
      });
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
    const r = await fetch(`${ESP32_URL.replace(/\/$/, '')}/status`, {
      signal: AbortSignal.timeout(4000),
    });
    const data = await r.json().catch(() => ({}));
    res.json({ alarm: data.alarm === 'active' ? 'active' : 'inactive' });
  } catch {
    res.json({ alarm: 'unknown' });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    authorized_slots: getActiveAuthorizedSlotIds(),
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`SecurityApp API : http://localhost:${PORT}`);
  console.log('Depuis le telephone (meme WiFi) :');
  for (const ifaces of Object.values(os.networkInterfaces())) {
    for (const iface of ifaces || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        console.log(`  → http://${iface.address}:${PORT}`);
      }
    }
  }
  console.log(`ESP32 URL       : ${ESP32_URL}`);
  console.log(`Slots actifs    : [${getActiveAuthorizedSlotIds().join(', ')}]`);
});
