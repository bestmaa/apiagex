const STORAGE_KEY = 'apiagex.admin.session';

export function getToken() {
  return getSession().token ?? '';
}

export function setToken(token) {
  setSession({ role: 'admin', token });
}

export function clearToken() {
  window.localStorage.removeItem(STORAGE_KEY);
}

export function getSession() {
  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return { expiresAt: null, role: 'viewer', token: '' };
  }

  try {
    const parsed = JSON.parse(raw);

    if (typeof parsed === 'string') {
      return { expiresAt: null, role: 'admin', token: parsed };
    }

    return {
      expiresAt: typeof parsed.expiresAt === 'number' ? parsed.expiresAt : null,
      role: typeof parsed.role === 'string' ? parsed.role : 'viewer',
      token: typeof parsed.token === 'string' ? parsed.token : '',
    };
  } catch {
    return { expiresAt: null, role: 'admin', token: raw };
  }
}

export function setSession(session) {
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      expiresAt: Number.isFinite(session.expiresAt) ? session.expiresAt : null,
      role: session.role ?? 'viewer',
      token: session.token ?? '',
    }),
  );
}

export function isSessionExpired(session, now = Date.now()) {
  return typeof session.expiresAt === 'number' && session.expiresAt <= now;
}
