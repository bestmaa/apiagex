import { createHash, randomBytes, randomUUID } from "node:crypto";
import type { ApiagexDatabase, DatabaseQueryParam } from "./database-adapter.type.js";
import type {
  ApiTokenRecord,
  CreatedApiToken,
  CreateApiTokenInput,
} from "./api-token-repository.type.js";
import { getRoleById } from "./role-repository.js";

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

export async function createApiToken(db: ApiagexDatabase, input: CreateApiTokenInput): Promise<CreatedApiToken> {
  await requireApiRole(db, input.roleId);
  const token = `agx_${randomBytes(32).toString("base64url")}`;
  const id = randomUUID();
  const now = new Date().toISOString();
  await db.prepare(
    `INSERT INTO api_tokens
      (id, role_id, name, token_hash, token_prefix, created_at, last_used_at, revoked_at)
     VALUES (?, ?, ?, ?, ?, ?, NULL, NULL)`,
  ).run(id, input.roleId, normalizeTokenName(input.name), hashToken(token), token.slice(0, 12), now);
  return { token, tokenRecord: await requireApiToken(db, id) };
}

export async function listApiTokens(db: ApiagexDatabase, roleId: string): Promise<ApiTokenRecord[]> {
  await requireApiRole(db, roleId);
  const rows = await db
    .prepare(tokenSelectSql("WHERE api_tokens.role_id = ? ORDER BY api_tokens.created_at DESC"))
    .all<ApiTokenRow>(roleId);
  return rows.map(rowToApiToken);
}

export async function revokeApiToken(
  db: ApiagexDatabase,
  roleId: string,
  tokenId: string,
): Promise<ApiTokenRecord | undefined> {
  await requireApiRole(db, roleId);
  const now = new Date().toISOString();
  await db.prepare("UPDATE api_tokens SET revoked_at = COALESCE(revoked_at, ?) WHERE id = ? AND role_id = ?")
    .run(now, tokenId, roleId);
  return getApiTokenById(db, tokenId, roleId);
}

export async function resolveApiToken(db: ApiagexDatabase, token: string): Promise<ApiTokenRecord | undefined> {
  const row = await db
    .prepare(tokenSelectSql("WHERE api_tokens.token_hash = ? AND api_tokens.revoked_at IS NULL AND roles.role_kind = 'api'"))
    .get<ApiTokenRow>(hashToken(token));
  if (!row) return undefined;
  await db.prepare("UPDATE api_tokens SET last_used_at = ? WHERE id = ?").run(new Date().toISOString(), row.id);
  return getApiTokenById(db, row.id);
}

async function getApiTokenById(
  db: ApiagexDatabase,
  tokenId: string,
  roleId?: string,
): Promise<ApiTokenRecord | undefined> {
  const suffix = roleId ? "WHERE api_tokens.id = ? AND api_tokens.role_id = ?" : "WHERE api_tokens.id = ?";
  const params: DatabaseQueryParam[] = roleId ? [tokenId, roleId] : [tokenId];
  const row = await db.prepare(tokenSelectSql(suffix)).get<ApiTokenRow>(...params);
  return row ? rowToApiToken(row) : undefined;
}

async function requireApiToken(db: ApiagexDatabase, tokenId: string): Promise<ApiTokenRecord> {
  const token = await getApiTokenById(db, tokenId);
  if (!token) throw new Error("API_TOKEN_NOT_FOUND");
  return token;
}

async function requireApiRole(db: ApiagexDatabase, roleId: string): Promise<void> {
  const role = await getRoleById(db, roleId);
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
