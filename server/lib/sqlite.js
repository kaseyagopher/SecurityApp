import initSqlJs from 'sql.js';
import fs from 'fs';

/**
 * Adaptateur style better-sqlite3 (sync) sur sql.js — pas de compilation native.
 */
export async function createDatabase(dbPath) {
  const SQL = await initSqlJs();
  const database = fs.existsSync(dbPath)
    ? new SQL.Database(fs.readFileSync(dbPath))
    : new SQL.Database();

  function persist() {
    fs.writeFileSync(dbPath, Buffer.from(database.export()));
  }

  function prepare(sql) {
    return {
      get(...params) {
        const stmt = database.prepare(sql);
        try {
          if (params.length) stmt.bind(params);
          if (stmt.step()) return stmt.getAsObject();
          return undefined;
        } finally {
          stmt.free();
        }
      },
      all(...params) {
        const stmt = database.prepare(sql);
        try {
          if (params.length) stmt.bind(params);
          const rows = [];
          while (stmt.step()) rows.push(stmt.getAsObject());
          return rows;
        } finally {
          stmt.free();
        }
      },
      run(...params) {
        database.run(sql, params);
        persist();
        const idRow = database.exec('SELECT last_insert_rowid() AS id');
        const lastInsertRowid = idRow[0]?.values[0]?.[0] ?? 0;
        return { lastInsertRowid, changes: database.getRowsModified() };
      },
    };
  }

  function exec(sql) {
    database.exec(sql);
    persist();
  }

  return { prepare, exec };
}

export function isUniqueConstraintError(err) {
  const msg = String(err?.message ?? err);
  return msg.includes('UNIQUE') || msg.includes('constraint');
}
