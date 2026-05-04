import { apiFetch } from './api.js';
import { text } from './media-i18n.js';
import { canAccess } from './permissions.js';
import { getSession } from './session.js';

const state = {
  items: [],
  loaded: false,
};

const refs = {
  file: document.getElementById('media-file'),
  list: document.getElementById('media-list'),
  refresh: document.getElementById('media-refresh'),
  shell: document.getElementById('media-shell'),
  status: document.getElementById('media-status'),
  upload: document.getElementById('media-upload'),
};

init();

export function loadMediaFiles() {
  return load();
}

export function getMediaFiles() {
  return state.items;
}

export function clearMediaFiles() {
  state.items = [];
  state.loaded = false;
  window.apiagexMediaFiles = [];
  render();
}

function init() {
  window.addEventListener('apiagex:language-changed', render);
  refs.refresh.addEventListener('click', () => {
    void load();
  });
  refs.upload.addEventListener('click', () => {
    void uploadSelectedFile();
  });
  render();
}

async function load() {
  if (!canRead()) {
    clearMediaFiles();
    return;
  }

  setStatus('uploading');
  const response = await apiFetch('/api/media-files');

  if (!response.ok) {
    clearMediaFiles();
    return;
  }

  const data = await response.json();
  state.items = Array.isArray(data.items) ? data.items : [];
  state.loaded = true;
  window.apiagexMediaFiles = state.items;
  window.dispatchEvent(new CustomEvent('apiagex:media-changed'));
  setStatus('');
  render();
}

async function uploadSelectedFile() {
  if (!canWrite()) {
    return;
  }

  const file = refs.file.files?.[0];

  if (!file) {
    setStatus(text('uploadFailed'));
    return;
  }

  setStatus(text('uploading'));
  const payload = {
    base64: await fileToBase64(file),
    filename: file.name,
    mimeType: file.type || 'application/octet-stream',
  };
  const response = await apiFetch('/api/media-files', {
    body: JSON.stringify(payload),
    headers: { 'content-type': 'application/json' },
    method: 'POST',
  });

  if (!response.ok) {
    setStatus(text('uploadFailed'));
    return;
  }

  refs.file.value = '';
  await load();
}

function render() {
  const visible = canRead();
  refs.shell.classList.toggle('hidden', !visible);

  if (!visible) {
    refs.list.innerHTML = '';
    refs.status.textContent = '';
    return;
  }

  refs.status.textContent = state.loaded ? `${state.items.length} item(s)` : text('hint');
  refs.list.innerHTML = renderList();
}

function renderList() {
  if (!state.loaded) {
    return `<p class="muted">${escapeHtml(text('hint'))}</p>`;
  }

  if (!state.items.length) {
    return `<p class="muted">${escapeHtml(text('empty'))}</p>`;
  }

  return state.items
    .map(
      (item) => `
        <article class="media-item">
          <strong>${escapeHtml(item.filename)}</strong>
          <span>${escapeHtml(item.mimeType)}</span>
          <small>${escapeHtml(item.id)}</small>
        </article>
      `,
    )
    .join('');
}

function setStatus(message) {
  refs.status.textContent = message;
}

function canRead() {
  return canAccess(getSession().role, 'media-files', 'read');
}

function canWrite() {
  return canAccess(getSession().role, 'media-files', 'write');
}

async function fileToBase64(file) {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
