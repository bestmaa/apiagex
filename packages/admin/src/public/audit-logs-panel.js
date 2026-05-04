import { escapeHtml } from './content-types-access.js';
import { canAccess } from './permissions.js';
import { getSession } from './session.js';
import { text } from './audit-logs-i18n.js';

export function createAuditLogsPanel(apiFetch) {
  const state = {
    items: [],
    loaded: false,
    statusDetail: '',
    statusKey: 'empty',
  };

  const refs = {
    list: document.getElementById('audit-list'),
    refresh: document.getElementById('audit-refresh'),
    shell: document.getElementById('audit-shell'),
    status: document.getElementById('audit-status'),
  };

  init();

  return {
    clear,
    load,
  };

  function init() {
    window.addEventListener('apiagex:language-changed', render);
    refs.refresh.addEventListener('click', () => {
      void load();
    });
    render();
  }

  function canRead() {
    return canAccess(getSession().role, 'audit-logs', 'read');
  }

  function clear() {
    state.items = [];
    state.loaded = false;
    state.statusDetail = '';
    state.statusKey = 'empty';
    render();
  }

  async function load() {
    if (!canRead()) {
      clear();
      return;
    }

    state.loaded = false;
    setStatus('loading');
    render();

    const response = await apiFetch('/api/audit-logs');

    if (!response.ok) {
      setStatus(response.status === 403 ? 'forbidden' : 'loadFailed');
      render();
      return;
    }

    const data = await response.json();
    state.items = Array.isArray(data.items) ? data.items : [];
    state.loaded = true;
    setStatus('itemCount', String(state.items.length));
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

    refs.status.textContent = text(state.statusKey, state.statusDetail);
    refs.list.innerHTML = renderRows();
  }

  function renderRows() {
    if (!state.loaded) {
      return `<p class="muted">${escapeHtml(text(state.statusKey))}</p>`;
    }

    if (!state.items.length) {
      return `<p class="muted">${escapeHtml(text('empty'))}</p>`;
    }

    return `
      <div class="audit-grid">
        <div class="audit-head">
          <span>${escapeHtml(text('time'))}</span>
          <span>${escapeHtml(text('action'))}</span>
          <span>${escapeHtml(text('scope'))}</span>
          <span>${escapeHtml(text('subject'))}</span>
          <span>${escapeHtml(text('actor'))}</span>
          <span>${escapeHtml(text('details'))}</span>
        </div>
        ${state.items.map(renderRow).join('')}
      </div>
    `;
  }

  function renderRow(item) {
    return `
      <article class="audit-row">
        <span class="audit-cell">${escapeHtml(formatTime(item.createdAt))}</span>
        <span class="audit-cell"><span class="badge">${escapeHtml(item.action)}</span></span>
        <span class="audit-cell">${escapeHtml(item.scope)}</span>
        <span class="audit-cell">${escapeHtml(item.subjectId)}</span>
        <span class="audit-cell">
          <strong>${escapeHtml(item.actorEmail)}</strong>
          <small>${escapeHtml(item.actorRole)}</small>
        </span>
        <span class="audit-cell">${escapeHtml(formatDetails(item.details))}</span>
      </article>
    `;
  }

  function setStatus(key, detail = '') {
    state.statusKey = key;
    state.statusDetail = detail;
  }
}

function formatTime(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value ?? '');
  }

  return new Intl.DateTimeFormat(document.documentElement.lang === 'hi' ? 'hi-IN' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function formatDetails(value) {
  try {
    const serialized = JSON.stringify(value ?? {});
    return serialized.length > 120 ? `${serialized.slice(0, 117)}...` : serialized;
  } catch {
    return '{}';
  }
}
