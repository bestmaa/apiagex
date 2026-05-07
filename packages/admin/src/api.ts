import type { AuthResponse } from "./session.type";
import type {
  EntryDeleteResponse,
  EntryData,
  EntryListResponse,
  EntryMutationResponse,
} from "./entry.type";
import type {
  PermissionDraft,
  PermissionListResponse,
  RoleListResponse,
  RoleMutationResponse,
} from "./role.type";
import type { UserListResponse, UserMutationResponse } from "./user.type";
import type {
  SchemaDraft,
  SchemaDeleteResponse,
  SchemaListResponse,
  SchemaMutationResponse,
} from "./schema.type";

export async function authenticateOwner(
  email: string,
  password: string,
): Promise<AuthResponse> {
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
  const response = await fetch("/api/admin/schemas");
  return (await response.json()) as SchemaListResponse;
}

export async function createSchema(input: SchemaDraft): Promise<SchemaMutationResponse> {
  const response = await fetch("/api/admin/schemas", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  return (await response.json()) as SchemaMutationResponse;
}

export async function updateSchema(
  schemaId: string,
  input: SchemaDraft,
): Promise<SchemaMutationResponse> {
  const response = await fetch(`/api/admin/schemas/${schemaId}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  return (await response.json()) as SchemaMutationResponse;
}

export async function deleteSchema(schemaId: string): Promise<SchemaDeleteResponse> {
  const response = await fetch(`/api/admin/schemas/${schemaId}`, {
    method: "DELETE",
  });
  return (await response.json()) as SchemaDeleteResponse;
}

export async function listEntries(schemaId: string): Promise<EntryListResponse> {
  const response = await fetch(`/api/admin/schemas/${schemaId}/entries`);
  return (await response.json()) as EntryListResponse;
}

export async function createEntry(
  schemaId: string,
  data: EntryData,
): Promise<EntryMutationResponse> {
  const response = await fetch(`/api/admin/schemas/${schemaId}/entries`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ data }),
  });
  return (await response.json()) as EntryMutationResponse;
}

export async function updateEntry(
  schemaId: string,
  entryId: string,
  data: EntryData,
): Promise<EntryMutationResponse> {
  const response = await fetch(`/api/admin/schemas/${schemaId}/entries/${entryId}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ data }),
  });
  return (await response.json()) as EntryMutationResponse;
}

export async function deleteEntry(
  schemaId: string,
  entryId: string,
): Promise<EntryDeleteResponse> {
  const response = await fetch(`/api/admin/schemas/${schemaId}/entries/${entryId}`, {
    method: "DELETE",
  });
  return (await response.json()) as EntryDeleteResponse;
}

export async function listRoles(): Promise<RoleListResponse> {
  const response = await fetch("/api/admin/roles");
  return (await response.json()) as RoleListResponse;
}

export async function createRole(
  name: string,
  description: string,
): Promise<RoleMutationResponse> {
  const response = await fetch("/api/admin/roles", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name, description }),
  });
  return (await response.json()) as RoleMutationResponse;
}

export async function listRolePermissions(roleId: string): Promise<PermissionListResponse> {
  const response = await fetch(`/api/admin/roles/${roleId}/permissions`);
  return (await response.json()) as PermissionListResponse;
}

export async function saveRolePermissions(
  roleId: string,
  permissions: PermissionDraft[],
): Promise<PermissionListResponse> {
  const response = await fetch(`/api/admin/roles/${roleId}/permissions`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ permissions }),
  });
  return (await response.json()) as PermissionListResponse;
}

export async function listUsers(): Promise<UserListResponse> {
  const response = await fetch("/api/admin/users");
  return (await response.json()) as UserListResponse;
}

export async function createUser(input: {
  email: string;
  password: string;
  roleId: string;
}): Promise<UserMutationResponse> {
  const response = await fetch("/api/admin/users", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  return (await response.json()) as UserMutationResponse;
}
