import type { AuthResponse } from "./session.type";

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
