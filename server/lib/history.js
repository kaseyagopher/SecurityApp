import { db } from '../db.js';
import { sqliteUtcToIso } from './datetime.js';

const EVENT_TO_APP = {
  fingerprint_granted: 'door_open',
  fingerprint_denied: 'door_denied',
  door_open: 'door_open',
  door_denied: 'door_denied',
  alarm: 'alarm',
  enrollment: 'enrollment',
  entry_request: 'door_open',
};

export function insertAccessHistory({
  userId = null,
  eventType,
  result,
  details = null,
  fingerprintSlot = null,
  source = 'app',
  method = null,
  confidence = null,
}) {
  const resolvedMethod =
    method ??
    (source === 'esp32'
      ? 'Empreinte (porte)'
      : source === 'remote'
        ? 'Ouverture a distance'
        : 'Application');

  return db
    .prepare(`
      INSERT INTO history (
        user_id, event_type, result, details,
        fingerprint_slot, source, method, confidence
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      userId,
      eventType,
      result,
      details,
      fingerprintSlot,
      source,
      resolvedMethod,
      confidence
    ).lastInsertRowid;
}

export function mapHistoryRow(row) {
  const eventType = EVENT_TO_APP[row.event_type] ?? row.event_type;
  let userName = row.name ?? null;
  if (!userName && row.event_type === 'fingerprint_denied') {
    userName = 'Inconnu';
  }
  if (!userName && row.event_type === 'fingerprint_granted') {
    userName = 'Inconnu';
  }
  return {
    id: row.id,
    event_type: eventType,
    result: row.result,
    method: row.method ?? 'Application',
    userName,
    details: row.details,
    created_at: sqliteUtcToIso(row.created_at),
    fingerprint_slot: row.fingerprint_slot ?? null,
    source: row.source ?? 'app',
  };
}

export function getHistoryRows(limit = 50) {
  const rows = db
    .prepare(`
      SELECT h.id, h.event_type, h.result, h.details, h.created_at,
             h.fingerprint_slot, h.source, h.method, h.confidence,
             u.name, u.email
      FROM history h
      LEFT JOIN users u ON u.id = h.user_id
      ORDER BY h.created_at DESC
      LIMIT ?
    `)
    .all(limit);
  return rows.map(mapHistoryRow);
}
