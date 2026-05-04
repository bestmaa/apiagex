import type { AuthResponse } from "./session.type";
import type {
  SchemaDraft,
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
