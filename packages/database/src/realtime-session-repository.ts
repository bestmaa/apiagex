import { createHash, randomBytes, randomUUID } from "node:crypto";
import type { SqliteDatabase } from "./sqlite.js";
import type {
  CreatedRealtimeSession,
  CreateRealtimeSessionInput,
  RealtimeSessionRecord,
} from "./realtime-session-repository.type.js";

type RealtimeSessionRow = RealtimeSessionRecord;

export function createRealtimeSession(db: SqliteDatabase, input: CreateRealtimeSessionInput): CreatedRealtimeSession {
  const now = new Date();
  const ttlSeconds = Math.max(30, Math.min(input.ttlSeconds ?? 300, 900));
  const token = `rt_${randomBytes(32).toString("base64url")}`;
  const id = randomUUID();
  db.prepare(
    `INSERT INTO realtime_sessions
      (id, token_hash, token_prefix, role_id, schema_id, schema_slug, created_at, expires_at, used_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
  ).run(
    id,
    hashToken(token),
    token.slice(0, 12),
    input.roleId,
    input.schemaId,
    input.schemaSlug,
    now.toISOString(),
    new Date(now.getTime() + ttlSeconds * 1000).toISOString(),
  );
  return { token, session: requireRealtimeSession(db, id) };
}

export function consumeRealtimeSession(
  db: SqliteDatabase,
  token: string,
  schemaSlug: string,
  now = new Date(),
): RealtimeSessionRecord | undefined {
  const row = db.prepare(sessionSelectSql("WHERE token_hash = ? AND schema_slug = ?"))
    .get(hashToken(token), schemaSlug) as RealtimeSessionRow | undefined;
  if (!row || row.usedAt || Date.parse(row.expiresAt) <= now.getTime()) return undefined;
  const result = db.prepare("UPDATE realtime_sessions SET used_at = ? WHERE id = ? AND used_at IS NULL")
    .run(now.toISOString(), row.id);
  if (result.changes !== 1) return undefined;
  return getRealtimeSessionById(db, row.id);
}

function getRealtimeSessionById(db: SqliteDatabase, id: string): RealtimeSessionRecord | undefined {
  const row = db.prepare(sessionSelectSql("WHERE id = ?")).get(id) as RealtimeSessionRow | undefined;
  return row;
}

function requireRealtimeSession(db: SqliteDatabase, id: string): RealtimeSessionRecord {
  const session = getRealtimeSessionById(db, id);
  if (!session) throw new Error("REALTIME_SESSION_NOT_FOUND");
  return session;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function sessionSelectSql(suffix: string): string {
  return `SELECT id, token_prefix as tokenPrefix, role_id as roleId, schema_id as schemaId, schema_slug as schemaSlug, created_at as createdAt, expires_at as expiresAt, used_at as usedAt FROM realtime_sessions ${suffix}`;
}
