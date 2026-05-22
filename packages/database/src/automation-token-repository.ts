import { createHash, randomBytes, randomUUID } from "node:crypto";
import type { ApiagexDatabase } from "./database-adapter.type.js";
import {
  AUTOMATION_TOKEN_SCOPES,
  type AutomationTokenRecord,
  type AutomationTokenScope,
  type CreatedAutomationToken,
  type CreateAutomationTokenInput,
  type ResolvedAutomationToken,
} from "./automation-token-repository.type.js";

type AutomationTokenRow = {
  id: string;
  name: string;
  tokenPrefix: string;
  scopesJson: string;
  createdAt: string;
  expiresAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdById: string | null;
  createdByEmail: string | null;
};

const DEFAULT_TTL_MINUTES = 60;
const MAX_TTL_MINUTES = 24 * 60;

export async function createAutomationToken(
  db: ApiagexDatabase,
  input: CreateAutomationTokenInput = {},
): Promise<CreatedAutomationToken> {
  const token = `agx_auto_${randomBytes(32).toString("base64url")}`;
  const id = randomUUID();
  const now = new Date();
  const ttlMinutes = normalizeTtlMinutes(input.ttlMinutes);
  const expiresAt = new Date(now.getTime() + ttlMinutes * 60_000).toISOString();
  const scopes = normalizeScopes(input.scopes);

  await db.prepare(
    `INSERT INTO automation_tokens
      (id, name, token_hash, token_prefix, scopes_json, created_at, expires_at, last_used_at, revoked_at, created_by_id, created_by_email)
     VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?)`,
  ).run(
    id,
    normalizeTokenName(input.name),
    hashToken(token),
    token.slice(0, 16),
    JSON.stringify(scopes),
    now.toISOString(),
    expiresAt,
    input.createdById ?? null,
    input.createdByEmail ?? null,
  );

  return { token, tokenRecord: await requireAutomationToken(db, id) };
}

export async function listAutomationTokens(db: ApiagexDatabase): Promise<AutomationTokenRecord[]> {
  const rows = await db
    .prepare(automationTokenSelectSql("ORDER BY created_at DESC"))
    .all<AutomationTokenRow>();
  return rows.map(rowToAutomationToken);
}

export async function revokeAutomationToken(
  db: ApiagexDatabase,
  tokenId: string,
): Promise<AutomationTokenRecord | undefined> {
  const now = new Date().toISOString();
  await db.prepare("UPDATE automation_tokens SET revoked_at = COALESCE(revoked_at, ?) WHERE id = ?").run(now, tokenId);
  return getAutomationTokenById(db, tokenId);
}

export async function resolveAutomationToken(
  db: ApiagexDatabase,
  token: string,
  requiredScopes: AutomationTokenScope[] = [],
): Promise<ResolvedAutomationToken | undefined> {
  const row = await db
    .prepare(automationTokenSelectSql("WHERE token_hash = ? AND revoked_at IS NULL"))
    .get<AutomationTokenRow>(hashToken(token));
  if (!row) return undefined;

  const tokenRecord = rowToAutomationToken(row);
  if (new Date(tokenRecord.expiresAt).getTime() <= Date.now()) return undefined;
  if (!hasRequiredScopes(tokenRecord.scopes, requiredScopes)) return undefined;

  await db.prepare("UPDATE automation_tokens SET last_used_at = ? WHERE id = ?").run(new Date().toISOString(), row.id);
  return { tokenRecord: await requireAutomationToken(db, row.id) };
}

async function getAutomationTokenById(
  db: ApiagexDatabase,
  tokenId: string,
): Promise<AutomationTokenRecord | undefined> {
  const row = await db
    .prepare(automationTokenSelectSql("WHERE id = ?"))
    .get<AutomationTokenRow>(tokenId);
  return row ? rowToAutomationToken(row) : undefined;
}

async function requireAutomationToken(db: ApiagexDatabase, tokenId: string): Promise<AutomationTokenRecord> {
  const token = await getAutomationTokenById(db, tokenId);
  if (!token) throw new Error("AUTOMATION_TOKEN_NOT_FOUND");
  return token;
}

function normalizeTokenName(name: string | undefined): string {
  const normalized = name?.trim() || "Codex automation token";
  if (normalized.length > 80) throw new Error("AUTOMATION_TOKEN_NAME_TOO_LONG");
  return normalized;
}

function normalizeTtlMinutes(ttlMinutes: number | undefined): number {
  if (ttlMinutes === undefined) return DEFAULT_TTL_MINUTES;
  if (!Number.isInteger(ttlMinutes) || ttlMinutes < 1) throw new Error("AUTOMATION_TOKEN_TTL_INVALID");
  if (ttlMinutes > MAX_TTL_MINUTES) throw new Error("AUTOMATION_TOKEN_TTL_TOO_LONG");
  return ttlMinutes;
}

function normalizeScopes(scopes: AutomationTokenScope[] | undefined): AutomationTokenScope[] {
  const requested = scopes?.length ? scopes : [...AUTOMATION_TOKEN_SCOPES];
  const allowed = new Set<string>(AUTOMATION_TOKEN_SCOPES);
  for (const scope of requested) {
    if (!allowed.has(scope)) throw new Error("AUTOMATION_TOKEN_SCOPE_INVALID");
  }
  return [...new Set(requested)];
}

function hasRequiredScopes(scopes: AutomationTokenScope[], requiredScopes: AutomationTokenScope[]): boolean {
  const granted = new Set(scopes);
  return requiredScopes.every((scope) => granted.has(scope));
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function rowToAutomationToken(row: AutomationTokenRow): AutomationTokenRecord {
  return {
    id: row.id,
    name: row.name,
    tokenPrefix: row.tokenPrefix,
    scopes: parseScopes(row.scopesJson),
    createdAt: row.createdAt,
    expiresAt: row.expiresAt,
    lastUsedAt: row.lastUsedAt,
    revokedAt: row.revokedAt,
    createdById: row.createdById,
    createdByEmail: row.createdByEmail,
  };
}

function parseScopes(scopesJson: string): AutomationTokenScope[] {
  const parsed: unknown = JSON.parse(scopesJson);
  if (!Array.isArray(parsed)) return [];
  const allowed = new Set<string>(AUTOMATION_TOKEN_SCOPES);
  return parsed.filter((scope): scope is AutomationTokenScope => typeof scope === "string" && allowed.has(scope));
}

function automationTokenSelectSql(suffix: string): string {
  return `SELECT id,
    name,
    token_prefix as tokenPrefix,
    scopes_json as scopesJson,
    created_at as createdAt,
    expires_at as expiresAt,
    last_used_at as lastUsedAt,
    revoked_at as revokedAt,
    created_by_id as createdById,
    created_by_email as createdByEmail
    FROM automation_tokens
    ${suffix}`;
}
