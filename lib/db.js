// MySQL connection pool.
//
// Created lazily: `next build` imports this module, and a build shouldn't need a
// reachable database. Stashed on globalThis because dev-mode hot reload
// re-evaluates modules, which would otherwise leak a pool per edit.
import mysql from 'mysql2/promise';

const KEY = Symbol.for('watson.mysql.pool');

function create() {
  const uri = process.env.DATABASE_URL;
  if (!uri) throw new Error('DATABASE_URL is not set — copy .env.example to .env');

  return mysql.createPool({
    uri,
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_POOL_SIZE || 10),
    queueLimit: 0,
    charset: 'utf8mb4',
    timezone: 'Z',
    // Keeps DATETIME columns from being reinterpreted in the server's local zone.
    dateStrings: false
  });
}

export function db() {
  return (globalThis[KEY] ||= create());
}
