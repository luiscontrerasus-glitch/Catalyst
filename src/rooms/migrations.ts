import type { Client } from '@libsql/client';

// All statements must be idempotent: cold starts replay this additive schema.
// Add future replay-safe migrations; never replace an applied migration.
export const migrations = [
  { version: 1, statements: [
    "CREATE TABLE IF NOT EXISTS rooms (id TEXT PRIMARY KEY, project TEXT NOT NULL, revision INTEGER NOT NULL, invite_hash TEXT NOT NULL UNIQUE, invite_expires INTEGER NOT NULL, created_at TEXT NOT NULL)",
    "CREATE TABLE IF NOT EXISTS room_sessions (id TEXT PRIMARY KEY, room_id TEXT NOT NULL REFERENCES rooms(id), secret_hash TEXT NOT NULL UNIQUE, name TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('owner','contributor')), expires INTEGER NOT NULL)",
    "CREATE INDEX IF NOT EXISTS room_sessions_room ON room_sessions(room_id)",
    "CREATE TABLE IF NOT EXISTS room_activity (id TEXT PRIMARY KEY, room_id TEXT NOT NULL REFERENCES rooms(id), revision INTEGER NOT NULL, actor TEXT NOT NULL, summary TEXT NOT NULL, at TEXT NOT NULL)",
    "CREATE INDEX IF NOT EXISTS room_activity_room ON room_activity(room_id,revision)",
    "CREATE TABLE IF NOT EXISTS room_requests (room_id TEXT NOT NULL, member_id TEXT NOT NULL, request_id TEXT NOT NULL, fingerprint TEXT NOT NULL, PRIMARY KEY(room_id,member_id,request_id))",
  ] },
  { version: 2, statements: [
    'CREATE TABLE IF NOT EXISTS request_limits (key TEXT PRIMARY KEY, window_start INTEGER NOT NULL, count INTEGER NOT NULL)',
  ] },
];

export async function migrateRooms(db: Client) {
  // One atomic batch also handles concurrent cold starts. All current operations
  // are additive/idempotent, preserving databases created before version tracking.
  await db.batch([
    'CREATE TABLE IF NOT EXISTS catalyst_migrations (version INTEGER PRIMARY KEY)',
    ...migrations.flatMap(m => [
      ...m.statements,
      { sql: 'INSERT OR IGNORE INTO catalyst_migrations(version) VALUES (?)', args: [m.version] },
    ]),
  ], 'write');
}
