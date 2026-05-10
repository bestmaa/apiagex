import { createHash, randomBytes, randomUUID } from "node:crypto";
import type { SqliteDatabase } from "./sqlite.js";
import { getRoleById } from "./role-repository.js";
import type {
  ApiTokenRecord,
  CreatedApiToken,
  CreateApiTokenInput,
} from "./api-token-repository.type.js";

type ApiTokenRow = {
  id: string;
  roleId: string;
  roleName: string;
  name: string;
  tokenPrefix: string;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
};

export function createApiToken(db: SqliteDatabase, input: CreateApiTokenInput): CreatedApiToken {
  requireApiRole(db, input.roleId);
  const token = `agx_${randomBytes(32).toString("base64url")}`;
  const id = randomUUID();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO api_tokens
      (id, role_id, name, token_hash, token_prefix, created_at, last_used_at, revoked_at)
     VALUES (?, ?, ?, ?, ?, ?, NULL, NULL)`,
  ).run(id, input.roleId, normalizeTokenName(input.name), hashToken(token), token.slice(0, 12), now);
  return { token, tokenRecord: requireApiToken(db, id) };
}

export function listApiTokens(db: SqliteDatabase, roleId: string): ApiTokenRecord[] {
  requireApiRole(db, roleId);
  const rows = db
    .prepare(tokenSelectSql("WHERE api_tokens.role_id = ? ORDER BY api_tokens.created_at DESC"))
    .all(roleId) as ApiTokenRow[];
  return rows.map(rowToApiToken);
}

export function revokeApiToken(
  db: SqliteDatabase,
  roleId: string,
  tokenId: string,
): ApiTokenRecord | undefined {
  requireApiRole(db, roleId);
  const now = new Date().toISOString();
  db.prepare("UPDATE api_tokens SET revoked_at = COALESCE(revoked_at, ?) WHERE id = ? AND role_id = ?")
    .run(now, tokenId, roleId);
  return getApiTokenById(db, tokenId, roleId);
}

export function resolveApiToken(db: SqliteDatabase, token: string): ApiTokenRecord | undefined {
  const row = db
    .prepare(tokenSelectSql("WHERE api_tokens.token_hash = ? AND api_tokens.revoked_at IS NULL AND roles.role_kind = 'api'"))
    .get(hashToken(token)) as ApiTokenRow | undefined;
  if (!row) return undefined;
  db.prepare("UPDATE api_tokens SET last_used_at = ? WHERE id = ?")
    .run(new Date().toISOString(), row.id);
  return getApiTokenById(db, row.id);
}

function getApiTokenById(
  db: SqliteDatabase,
  tokenId: string,
  roleId?: string,
): ApiTokenRecord | undefined {
  const suffix = roleId ? "WHERE api_tokens.id = ? AND api_tokens.role_id = ?" : "WHERE api_tokens.id = ?";
  const params = roleId ? [tokenId, roleId] : [tokenId];
  const row = db.prepare(tokenSelectSql(suffix)).get(...params) as ApiTokenRow | undefined;
  return row ? rowToApiToken(row) : undefined;
}

function requireApiToken(db: SqliteDatabase, tokenId: string): ApiTokenRecord {
  const token = getApiTokenById(db, tokenId);
  if (!token) throw new Error("API_TOKEN_NOT_FOUND");
  return token;
}

function requireApiRole(db: SqliteDatabase, roleId: string): void {
  const role = getRoleById(db, roleId);
  if (!role) throw new Error("ROLE_NOT_FOUND");
  if (role.roleKind !== "api") throw new Error("ROLE_API_REQUIRED");
}

function normalizeTokenName(name: string | undefined): string {
  const normalized = name?.trim() || "API token";
  if (normalized.length > 80) throw new Error("API_TOKEN_NAME_TOO_LONG");
  return normalized;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function rowToApiToken(row: ApiTokenRow): ApiTokenRecord {
  return row;
}

function tokenSelectSql(suffix: string): string {
  return `SELECT api_tokens.id,
    api_tokens.role_id as roleId,
    roles.name as roleName,
    api_tokens.name,
    api_tokens.token_prefix as tokenPrefix,
    api_tokens.created_at as createdAt,
    api_tokens.last_used_at as lastUsedAt,
    api_tokens.revoked_at as revokedAt
    FROM api_tokens
    JOIN roles ON roles.id = api_tokens.role_id
    ${suffix}`;
}
