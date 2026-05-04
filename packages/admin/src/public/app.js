import { apiFetch } from './api.js';
import { clearToken, getSession, isSessionExpired, setSession } from './session.js';
import { createContentTypesPanel } from './content-types-panel.js';
import { createAuditLogsPanel } from './audit-logs-panel.js';
import { createBackupPanel } from './backup-panel.js';
import { clearMediaFiles, loadMediaFiles } from './media.js';
import { createMigrationsPanel } from './migrations-panel.js';
import { createRolesPanel } from './roles-panel.js';
import { createOpsPanel } from './ops-panel.js';
import { createWebhooksPanel } from './webhooks-panel.js';
import { createGlobalSearchPanel } from './search-panel.js';
import { createDashboardRealtime } from './dashboard-realtime.js';
import { createRealtimePage } from './realtime-page.js';
import { createAdminRouter } from './admin-router.js';
import './entries.js';
import { translations } from './app-i18n.js';

const panel = createContentTypesPanel(apiFetch);
const auditPanel = createAuditLogsPanel(apiFetch);
const backupPanel = createBackupPanel();
const migrationsPanel = createMigrationsPanel();
const rolesPanel = createRolesPanel(apiFetch);
const opsPanel = createOpsPanel(apiFetch);
const webhooksPanel = createWebhooksPanel(apiFetch);
const searchPanel = createGlobalSearchPanel(apiFetch);
const realtimePage = createRealtimePage(apiFetch);
const router = createAdminRouter();
const realtime = createDashboardRealtime({
  auditPanel,
  loadMediaFiles,
  panel,
  refs: {
    appShell: document.getElementById('app-shell'),
    realtimeStatus: document.getElementById('realtime-status'),
  },
  realtimePage,
  translations,
  webhooksPanel,
});

const refs = {
  appShell: document.getElementById('app-shell'),
  loginEmail: document.getElementById('login-email'),
  loginForm: document.getElementById('login-form'),
  loginPassword: document.getElementById('login-password'),
  loginShell: document.getElementById('login-shell'),
  loginStatus: document.getElementById('login-status'),
  logout: document.getElementById('logout'),
  realtimeStatus: document.getElementById('realtime-status'),
  sessionRole: document.getElementById('session-role'),
};

init();

async function init() {
  document.querySelectorAll('[data-lang]').forEach((button) => {
    button.addEventListener('click', () => setLanguage(button.dataset.lang));
  });
  window.addEventListener('apiagex:session-expired', handleSessionExpired);
  window.addEventListener('apiagex:content-type-selected', realtime.rememberSelectedContentType);
  window.addEventListener('apiagex:content-type-deleted', realtime.clearSelectedContentType);
  refs.loginForm.addEventListener('submit', submitLogin);
  refs.logout.addEventListener('click', logout);
  setLanguage('en');
  await bootstrapSession();
}

function setLanguage(language) {
  document.documentElement.lang = language === 'hi' ? 'hi' : 'en';
  document.querySelectorAll('[data-lang]').forEach((button) => {
    button.classList.toggle('active', button.dataset.lang === language);
  });
  document.querySelectorAll('[data-i18n]').forEach((node) => {
    const key = node.dataset.i18n;
    node.textContent = translations[language][key] ?? node.textContent;
  });
  realtime.renderRealtimeStatus();
  window.dispatchEvent(new CustomEvent('apiagex:language-changed', { detail: { language } }));
}

async function bootstrapSession() {
  const session = getSession();

  if (!session.token) {
    showLogin();
  return;
  }

  if (isSessionExpired(session)) {
    handleSessionExpired();
    return;
  }

  const response = await apiFetch('/admin/content-types');

  if (!response.ok) {
    handleSessionExpired();
    return;
  }

  showApp();
  router.render();
  await Promise.all([
    auditPanel.load(),
    backupPanel.load(),
    loadMediaFiles(),
    migrationsPanel.load(),
    rolesPanel.load(),
    opsPanel.load(),
    panel.load(),
    realtimePage.load(),
    webhooksPanel.load(),
  ]);
  realtime.connect();
}

function showLogin() {
  refs.loginShell.classList.remove('hidden');
  refs.appShell.classList.add('hidden');
}

function showApp() {
  refs.loginShell.classList.add('hidden');
  refs.appShell.classList.remove('hidden');
  updateSessionRole();
  realtime.renderRealtimeStatus();
}

function updateSessionRole() {
  const session = getSession();
  refs.sessionRole.textContent = session.role ? `Role: ${session.role}` : '';
}

async function submitLogin(event) {
  event.preventDefault();
  refs.loginStatus.textContent = 'Signing in...';

  const response = await fetch('/auth/login', {
    body: JSON.stringify({
      email: refs.loginEmail.value.trim(),
      password: refs.loginPassword.value,
    }),
    headers: { 'content-type': 'application/json' },
    method: 'POST',
  });

  if (!response.ok) {
    refs.loginStatus.textContent = 'Invalid credentials.';
    return;
  }

  const data = await response.json();
  if (typeof data.token !== 'string' || !data.token) {
    refs.loginStatus.textContent = 'Login failed.';
    return;
  }

  setSession({
    expiresAt: typeof data.expiresAt === 'number' ? data.expiresAt : null,
    role: typeof data.user?.role === 'string' ? data.user.role : 'viewer',
    token: data.token,
  });
  refs.loginStatus.textContent = '';
  showApp();
  router.render();
  await Promise.all([
    auditPanel.load(),
    backupPanel.load(),
    loadMediaFiles(),
    migrationsPanel.load(),
    rolesPanel.load(),
    opsPanel.load(),
    panel.load(),
    realtimePage.load(),
    webhooksPanel.load(),
  ]);
  realtime.connect();
}

function logout() {
  resetSession();
}

function handleSessionExpired() {
  resetSession(translations[document.documentElement.lang || 'en'].sessionExpired);
}

function resetSession(statusMessage = '') {
  clearToken();
  panel.clear();
  auditPanel.clear();
  backupPanel.clear();
  clearMediaFiles();
  migrationsPanel.clear();
  rolesPanel.clear();
  opsPanel.clear();
  searchPanel.clear();
  realtimePage.clear();
  webhooksPanel.clear();
  realtime.reset();
  realtime.close();
  refs.sessionRole.textContent = '';
  refs.loginStatus.textContent = statusMessage;
  showLogin();
}
