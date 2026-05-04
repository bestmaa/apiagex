import { apiFetch } from './api.js';
import { translations } from './app-i18n.js';
import { getSession } from './session.js';

const state = {
  detail: null,
  loaded: false,
  status: 'idle',
};

const refs = {
  list: document.getElementById('ops-list'),
  refresh: document.getElementById('ops-refresh'),
  shell: document.getElementById('ops-shell'),
  status: document.getElementById('ops-status'),
};

let fetchApiRef = apiFetch;
let initialized = false;

export function createOpsPanel(fetchApi = apiFetch) {
  fetchApiRef = fetchApi;

  if (!initialized) {
    init();
    initialized = true;
  }

  return { clear, load, render };
}

function init() {
  refs.refresh?.addEventListener('click', () => {
    void load();
  });
  window.addEventListener('apiagex:language-changed', render);
  render();
}

async function load() {
  if (!canRead()) {
    clear();
    return;
  }

  state.status = 'loading';
  render();

  const response = await fetchApiRef('/api/health/detail');

  if (!response.ok) {
    state.detail = null;
    state.loaded = true;
    state.status = 'failed';
    render();
    return;
  }

  state.detail = await response.json();
  state.loaded = true;
  state.status = 'ready';
  render();
}

function clear() {
  state.detail = null;
  state.loaded = false;
  state.status = 'idle';
  render();
}

function render() {
  if (!refs.shell || !refs.list || !refs.status) {
    return;
  }

  const visible = canRead();
  refs.shell.classList.toggle('hidden', !visible);

  if (!visible) {
    refs.list.innerHTML = '';
    refs.status.textContent = '';
    return;
  }

  refs.status.textContent =
    state.status === 'loading'
      ? text('opsStatusLoading')
      : state.status === 'failed'
        ? text('opsStatusFailed')
        : state.loaded
          ? text('opsStatusReady')
          : text('opsStatusReady');
  refs.list.innerHTML = renderList();
}

function renderList() {
  if (!state.loaded || !state.detail) {
    return `<p class="muted">${escapeHtml(text('opsStatusReady'))}</p>`;
  }

  return [
    renderItem(text('opsService'), state.detail.service, text('opsStatus')),
    renderCacheItem(state.detail.cache),
    renderStorageItem(state.detail.storage),
    renderSchedulerItem(state.detail.scheduler),
  ].join('');
}

function renderItem(title, value, badgeLabel) {
  return `
    <article class="item">
      <div class="item-head">
        <strong>${escapeHtml(title)}</strong>
        <span class="badge">${escapeHtml(badgeLabel)}</span>
      </div>
      <p class="item-meta">${escapeHtml(String(value ?? ''))}</p>
    </article>
  `;
}

function renderCacheItem(cache) {
  const publicResponses = cache?.publicResponses ?? '';
  const schema = cache?.schema ?? '';

  return `
    <article class="item">
      <div class="item-head">
        <strong>${escapeHtml(text('opsCache'))}</strong>
        <span class="badge">${escapeHtml(text('opsPublicResponses'))}</span>
      </div>
      <p class="item-meta">${escapeHtml(text('opsPublicResponses'))}: ${escapeHtml(String(publicResponses))}</p>
      <p class="item-meta">${escapeHtml(text('opsSchema'))}: ${escapeHtml(String(schema))}</p>
    </article>
  `;
}

function renderStorageItem(storage) {
  const driver = storage?.driver ?? '';
  const uploadsPath = storage?.uploadsPath ?? '';

  return `
    <article class="item">
      <div class="item-head">
        <strong>${escapeHtml(text('opsStorage'))}</strong>
        <span class="badge">${escapeHtml(text('opsDriver'))}</span>
      </div>
      <p class="item-meta">${escapeHtml(text('opsDriver'))}: ${escapeHtml(String(driver))}</p>
      <p class="item-meta">${escapeHtml(text('opsUploadsPath'))}: ${escapeHtml(String(uploadsPath))}</p>
    </article>
  `;
}

function renderSchedulerItem(scheduler) {
  const status = scheduler?.status === 'running' ? text('opsRunning') : text('opsStopped');

  return `
    <article class="item">
      <div class="item-head">
        <strong>${escapeHtml(text('opsScheduler'))}</strong>
        <span class="badge">${escapeHtml(status)}</span>
      </div>
      <p class="item-meta">${escapeHtml(text('opsStatus'))}: ${escapeHtml(status)}</p>
    </article>
  `;
}

function canRead() {
  return ['admin', 'owner'].includes(getSession().role);
}

function text(key) {
  const language = document.documentElement.lang === 'hi' ? 'hi' : 'en';
  return translations[language][key] ?? translations.en[key] ?? key;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
