import type { AuthResponse, OwnerStatusResponse } from "./session.type";
import type {
  EntryDeleteResponse,
  EntryData,
  EntryListQuery,
  EntryListResponse,
  EntryMutationResponse,
} from "./entry.type";
import type {
  ApiTokenCreateResponse,
  ApiTokenListResponse,
  ApiTokenRevokeResponse,
  PermissionDraft,
  PermissionListResponse,
  RoleListResponse,
  RoleMutationResponse,
} from "./role.type";
import type {
  AccessSettingsResponse,
  AdminPermissionDraft,
  AdminPermissionListResponse,
} from "./settings.type";
import type { UserListResponse, UserMutationResponse } from "./user.type";
import type {
  SchemaDraft,
  SchemaDeleteResponse,
  SchemaListResponse,
  SchemaMutationResponse,
} from "./schema.type";

export const ownerSessionStorageKey = "apiagexOwner";

type StoredOwnerSession = {
  email: string;
  token: string;
};

let adminAuthToken = readStoredOwnerSession()?.token;

export function setAdminAuthToken(token: string | undefined): void {
  adminAuthToken = token;
}

export function readStoredOwnerSession(): StoredOwnerSession | null {
  const saved = localStorage.getItem(ownerSessionStorageKey);
  if (!saved) return null;
  try {
    const session = JSON.parse(saved) as StoredOwnerSession;
    if (!session.email || !session.token) return null;
    return session;
  } catch {
    return null;
  }
}

export async function validateOwnerSession(token: string): Promise<AuthResponse> {
  const response = await fetch("/api/auth/session", {
    headers: { authorization: `Bearer ${token}` },
  });
  return (await response.json()) as AuthResponse;
}

export async function readOwnerStatus(): Promise<OwnerStatusResponse> {
  const response = await fetch("/api/auth/owner-status");
  return (await response.json()) as OwnerStatusResponse;
}

export async function authenticateOwner(
  email: string,
  password: string,
  hasOwner?: boolean | null,
): Promise<AuthResponse> {
  if (hasOwner === true) return (await requestAuth("/api/auth/login", email, password)).body;
  if (hasOwner === false) return (await requestAuth("/api/auth/bootstrap-owner", email, password)).body;
  let result = await requestAuth("/api/auth/bootstrap-owner", email, password);
  if (result.status === 409) {
    result = await requestAuth("/api/auth/login", email, password);
  }
  return result.body;
}

async function requestAuth(
  path: string,
  email: string,
  password: string,
): Promise<{ status: number; body: AuthResponse }> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return { status: response.status, body: (await response.json()) as AuthResponse };
}

export async function listSchemas(): Promise<SchemaListResponse> {
  return adminJson<SchemaListResponse>("/api/admin/schemas");
}

export async function createSchema(input: SchemaDraft): Promise<SchemaMutationResponse> {
  return adminJson<SchemaMutationResponse>("/api/admin/schemas", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function updateSchema(
  schemaId: string,
  input: SchemaDraft,
): Promise<SchemaMutationResponse> {
  return adminJson<SchemaMutationResponse>(`/api/admin/schemas/${schemaId}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function deleteSchema(schemaId: string): Promise<SchemaDeleteResponse> {
  return adminJson<SchemaDeleteResponse>(`/api/admin/schemas/${schemaId}`, {
    method: "DELETE",
  });
}

export async function listEntries(
  schemaId: string,
  query: EntryListQuery = {},
): Promise<EntryListResponse> {
  const params = new URLSearchParams();
  if (query.fields) params.set("fields", query.fields.join(","));
  if (query.limit !== undefined) params.set("limit", String(query.limit));
  if (query.offset !== undefined) params.set("offset", String(query.offset));
  if (query.search) params.set("search", query.search);
  const suffix = params.size ? `?${params.toString()}` : "";
  return adminJson<EntryListResponse>(`/api/admin/schemas/${schemaId}/entries${suffix}`);
}

export async function createEntry(
  schemaId: string,
  data: EntryData,
): Promise<EntryMutationResponse> {
  return adminJson<EntryMutationResponse>(`/api/admin/schemas/${schemaId}/entries`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ data }),
  });
}

export async function updateEntry(
  schemaId: string,
  entryId: string,
  data: EntryData,
): Promise<EntryMutationResponse> {
  return adminJson<EntryMutationResponse>(`/api/admin/schemas/${schemaId}/entries/${entryId}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ data }),
  });
}

export async function deleteEntry(
  schemaId: string,
  entryId: string,
): Promise<EntryDeleteResponse> {
  return adminJson<EntryDeleteResponse>(`/api/admin/schemas/${schemaId}/entries/${entryId}`, {
    method: "DELETE",
  });
}

export async function listRoles(): Promise<RoleListResponse> {
  return adminJson<RoleListResponse>("/api/admin/roles");
}

export async function createRole(
  name: string,
  description: string,
): Promise<RoleMutationResponse> {
  return adminJson<RoleMutationResponse>("/api/admin/roles", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name, description }),
  });
}

export async function listRolePermissions(roleId: string): Promise<PermissionListResponse> {
  return adminJson<PermissionListResponse>(`/api/admin/roles/${roleId}/permissions`);
}

export async function saveRolePermissions(
  roleId: string,
  permissions: PermissionDraft[],
): Promise<PermissionListResponse> {
  return adminJson<PermissionListResponse>(`/api/admin/roles/${roleId}/permissions`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ permissions }),
  });
}

export async function listApiTokens(roleId: string): Promise<ApiTokenListResponse> {
  return adminJson<ApiTokenListResponse>(`/api/admin/roles/${roleId}/tokens`);
}

export async function createApiToken(
  roleId: string,
  name: string,
): Promise<ApiTokenCreateResponse> {
  return adminJson<ApiTokenCreateResponse>(`/api/admin/roles/${roleId}/tokens`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name }),
  });
}

export async function revokeApiToken(roleId: string, tokenId: string): Promise<ApiTokenRevokeResponse> {
  return adminJson<ApiTokenRevokeResponse>(`/api/admin/roles/${roleId}/tokens/${tokenId}`, {
    method: "DELETE",
  });
}

export async function listUsers(): Promise<UserListResponse> {
  return adminJson<UserListResponse>("/api/admin/users");
}

export async function listControlUsers(): Promise<UserListResponse> {
  return adminJson<UserListResponse>("/api/admin/control-users");
}

export async function createUser(input: {
  email: string;
  password: string;
  roleId: string;
}): Promise<UserMutationResponse> {
  return adminJson<UserMutationResponse>("/api/admin/users", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function createControlUser(input: {
  email: string;
  password: string;
  roleId: string;
}): Promise<UserMutationResponse> {
  return adminJson<UserMutationResponse>("/api/admin/control-users", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function listAccessSettings(): Promise<AccessSettingsResponse> {
  return adminJson<AccessSettingsResponse>("/api/admin/settings/access");
}

export async function createAdminRole(
  name: string,
  description: string,
): Promise<RoleMutationResponse> {
  return adminJson<RoleMutationResponse>("/api/admin/settings/access/admin-roles", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name, description }),
  });
}

export async function listAdminRolePermissions(
  roleId: string,
): Promise<AdminPermissionListResponse> {
  return adminJson<AdminPermissionListResponse>(`/api/admin/settings/access/admin-roles/${roleId}/permissions`);
}

export async function saveAdminRolePermissions(
  roleId: string,
  permissions: AdminPermissionDraft[],
): Promise<AdminPermissionListResponse> {
  return adminJson<AdminPermissionListResponse>(`/api/admin/settings/access/admin-roles/${roleId}/permissions`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ permissions }),
  });
}

export async function adminJson<TResult>(path: string, init: RequestInit = {}): Promise<TResult> {
  const headers = new Headers(init.headers);
  if (adminAuthToken) headers.set("authorization", `Bearer ${adminAuthToken}`);
  const response = await fetch(path, { ...init, headers });
  const result = (await response.json()) as TResult;
  if (response.status === 401) {
    localStorage.removeItem(ownerSessionStorageKey);
    setAdminAuthToken(undefined);
    window.dispatchEvent(new CustomEvent("apiagex-owner-session-invalid"));
  }
  return result;
}
