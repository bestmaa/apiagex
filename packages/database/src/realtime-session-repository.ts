import { createHash, randomBytes, randomUUID } from "node:crypto";
import type { ApiagexDatabase } from "./database-adapter.type.js";
import type {
  CreatedRealtimeSession,
  CreateRealtimeSessionInput,
  RealtimeSessionRecord,
} from "./realtime-session-repository.type.js";

type RealtimeSessionRow = RealtimeSessionRecord;

export async function createRealtimeSession(
  db: ApiagexDatabase,
  input: CreateRealtimeSessionInput,
): Promise<CreatedRealtimeSession> {
  const now = new Date();
  const ttlSeconds = Math.max(30, Math.min(input.ttlSeconds ?? 300, 900));
  const token = `rt_${randomBytes(32).toString("base64url")}`;
  const id = randomUUID();
  await db.prepare(
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
  return { token, session: await requireRealtimeSession(db, id) };
}

export async function consumeRealtimeSession(
  db: ApiagexDatabase,
  token: string,
  schemaSlug: string,
  now = new Date(),
): Promise<RealtimeSessionRecord | undefined> {
  const row = await db
    .prepare(sessionSelectSql("WHERE token_hash = ? AND schema_slug = ?"))
    .get<RealtimeSessionRow>(hashToken(token), schemaSlug);
  if (!row || row.usedAt || Date.parse(row.expiresAt) <= now.getTime()) return undefined;
  const result = await db.prepare("UPDATE realtime_sessions SET used_at = ? WHERE id = ? AND used_at IS NULL")
    .run(now.toISOString(), row.id);
  if (result.changes !== 1) return undefined;
  return getRealtimeSessionById(db, row.id);
}

async function getRealtimeSessionById(
  db: ApiagexDatabase,
  id: string,
): Promise<RealtimeSessionRecord | undefined> {
  return db.prepare(sessionSelectSql("WHERE id = ?")).get<RealtimeSessionRow>(id);
}

async function requireRealtimeSession(db: ApiagexDatabase, id: string): Promise<RealtimeSessionRecord> {
  const session = await getRealtimeSessionById(db, id);
  if (!session) throw new Error("REALTIME_SESSION_NOT_FOUND");
  return session;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function sessionSelectSql(suffix: string): string {
  return `SELECT id, token_prefix as tokenPrefix, role_id as roleId, schema_id as schemaId, schema_slug as schemaSlug, created_at as createdAt, expires_at as expiresAt, used_at as usedAt FROM realtime_sessions ${suffix}`;
}
