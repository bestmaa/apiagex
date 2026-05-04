import { apiFetch } from './api.js';
import { translations } from './app-i18n.js';
import { getSession } from './session.js';

export function createMigrationsPanel() {
  const state = { items: [], loaded: false, status: 'ready' };
  const refs = { list: null, refresh: null, shell: null, status: null };

  init();
  return { clear, load };

  function init() {
    refs.shell = document.createElement('section');
    refs.shell.id = 'migrations-shell';
    refs.shell.className = 'panel panel-wide hidden';
    refs.shell.dataset.routeSection = 'migrations';
    refs.shell.innerHTML = `
      <div class="panel-head">
        <h2 data-i18n="migrationsTitle">Migrations</h2>
        <p data-i18n="migrationsHint">Applied schema versions recorded by the server.</p>
      </div>
      <div class="actions">
        <button id="migrations-refresh" class="ghost" type="button" data-i18n="migrationsRefresh">Refresh</button>
        <p id="migrations-status" class="muted" aria-live="polite"></p>
      </div>
      <div id="migrations-list" class="migration-list"></div>
    `;

    refs.shell.addEventListener('click', (event) => {
      const button = event.target.closest('#migrations-refresh');
      if (button) {
        void load();
      }
    });

    document.querySelector('#webhooks-shell')?.insertAdjacentElement('beforebegin', refs.shell);
    refs.list = refs.shell.querySelector('#migrations-list');
    refs.refresh = refs.shell.querySelector('#migrations-refresh');
    refs.status = refs.shell.querySelector('#migrations-status');
    window.addEventListener('apiagex:language-changed', render);
    render();
  }

  function clear() {
    state.items = [];
    state.loaded = false;
    state.status = 'ready';
    render();
  }

  async function load() {
    if (!canRead()) {
      clear();
      return;
    }

    state.status = 'loading';
    render();

    const response = await apiFetch('/api/migrations');
    if (!response.ok) {
      state.status = 'failed';
      state.items = [];
      state.loaded = true;
      render();
      return;
    }

    const data = await response.json();
    state.items = Array.isArray(data.items) ? data.items : [];
    state.loaded = true;
    state.status = 'ready';
    render();
  }

  function render() {
    const visible = canRead();
    refs.shell.classList.toggle('hidden', !visible);

    if (!visible) {
      refs.list.innerHTML = '';
      refs.status.textContent = '';
      return;
    }

    refs.status.textContent =
      state.status === 'loading'
        ? text('loading')
        : state.status === 'failed'
          ? text('loadFailed')
          : state.loaded
            ? `${state.items.length} item(s)`
            : text('backupsStatus');
    refs.list.innerHTML = state.loaded
      ? state.items.length
        ? state.items.map(renderItem).join('')
        : `<p class="muted">${escapeHtml(text('empty'))}</p>`
      : `<p class="muted">${escapeHtml(text('backupsStatus'))}</p>`;
  }
}

function canRead() {
  return ['admin', 'owner'].includes(getSession().role);
}

function text(key) {
  const language = document.documentElement.lang === 'hi' ? 'hi' : 'en';
  return translations[language][key] ?? translations.en[key] ?? key;
}

function renderItem(item) {
  return `
    <article class="migration-item">
      <strong>${escapeHtml(item.name)}</strong>
      <span class="badge">${escapeHtml(item.scope)}</span>
      <small>${escapeHtml(item.appliedAt)}</small>
    </article>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
