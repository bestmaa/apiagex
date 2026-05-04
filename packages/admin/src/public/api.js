import { clearToken, getSession, getToken, isSessionExpired } from './session.js';

export async function apiFetch(path, init = {}) {
  const session = getSession();

  if (isSessionExpired(session)) {
    expireSession();
    return unauthorizedResponse();
  }

  const headers = new Headers(init.headers ?? {});
  const token = getToken();

  if (token) {
    headers.set('authorization', `Bearer ${token}`);
  }

  const response = await fetch(path, {
    ...init,
    headers,
  });

  if (response.status === 401) {
    expireSession();
  }

  return response;
}

function expireSession() {
  clearToken();
  window.dispatchEvent(new CustomEvent('apiagex:session-expired'));
}

function unauthorizedResponse() {
  return new Response(JSON.stringify({ message: 'Session expired' }), {
    headers: { 'content-type': 'application/json' },
    status: 401,
  });
}
