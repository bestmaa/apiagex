import { apiFetch } from './api.js';
import { text } from './entries-i18n.js';
import { collectEntryData, renderEntryFields, validateEntryData } from './entries-form.js';
import { renderEntriesList } from './entries-list.js';
import { createEntryVersionsPanel } from './entries-versions.js';
import { createEntriesBulkController } from './entries-bulk.js';
import {
  applyPermissions,
  canPreviewEntries,
  canWriteEntries,
  createPreviewEntryHandler,
  createVersionRestoreHandler,
  currentMediaFiles,
  normalizePublishAt,
  syncPublishAtState,
  toLocalDatetimeValue,
} from './entries-helpers.js';
import { getEntriesStatusFilter, initEntriesStatusFilter } from './entries-status-filter.js';
import { buildEntriesRequestUrl, getEntriesQuery, initEntriesQuery, renderQueryMeta, setEntriesQuery } from './entries-query.js';

const state = {
  contentTypeId: '',
  contentTypeName: '',
  editingId: '',
  fields: [],
  items: [],
  pendingEntryId: '',
  statusDetail: '',
  statusKey: 'ready',
};

const refs = {
  fields: document.getElementById('entry-fields'),
  form: document.getElementById('entry-form'),
  hint: document.getElementById('entry-hint'),
  id: document.getElementById('entry-id'),
  list: document.getElementById('entries-list'),
  name: document.getElementById('entry-type'),
  publishAt: document.getElementById('entry-publish-at'),
  reset: document.getElementById('entry-reset'),
  status: document.getElementById('entry-status'),
};

const previewEntry = createPreviewEntryHandler(apiFetch, () => state, setStatus);
const handleVersionRestored = createVersionRestoreHandler(selectContentType, () => state, fillForm, setStatus);
const versionsPanel = createEntryVersionsPanel(apiFetch, () => state, () => ({ data: getEntryData(), publishAt: normalizePublishAt(refs.publishAt.value), status: refs.status.value }), handleVersionRestored);
const bulkController = createEntriesBulkController(apiFetch, () => state, loadEntries, setStatus);

init();
function init() {
  window.addEventListener('apiagex:content-type-selected', (event) => {
    const detail = event.detail ?? {};
    void selectContentType(detail.id ?? '', detail.displayName ?? '', true);
  });
  window.addEventListener('apiagex:content-entry-selected', (event) => {
    const detail = event.detail ?? {};
    const contentTypeId = typeof detail.contentTypeId === 'string' ? detail.contentTypeId : '';
    const entryId = typeof detail.entryId === 'string' ? detail.entryId : '';

    if (!contentTypeId || !entryId) {
      return;
    }

    state.pendingEntryId = entryId;
    if (state.contentTypeId !== contentTypeId) {
      void selectContentType(contentTypeId, typeof detail.contentTypeName === 'string' ? detail.contentTypeName : contentTypeId, true);
      return;
    }
    applyPendingEntrySelection();
  });
  window.addEventListener('apiagex:content-type-deleted', (event) => {
    if ((event.detail ?? {}).id === state.contentTypeId) {
      clearSelection();
    }
  });
  window.addEventListener('apiagex:media-changed', renderLanguage);
  window.addEventListener('apiagex:language-changed', renderLanguage);
  window.addEventListener('apiagex:entries-query-changed', () => state.contentTypeId && void loadEntries());
  window.addEventListener('apiagex:entries-status-filter-changed', () => { if (!state.contentTypeId) return; if (getEntriesQuery().page !== 1) { setEntriesQuery({ page: 1 }); return; } void loadEntries(); });
  window.addEventListener('apiagex:entries-bulk-changed', renderLanguage);
  refs.form.addEventListener('submit', submitEntry);
  refs.reset.addEventListener('click', resetForm);
  refs.status.addEventListener('change', () => syncPublishAtState(refs.status, refs.publishAt));
  initEntriesStatusFilter();
  initEntriesQuery();
  renderLanguage();
  clearSelection();
}
function setStatus(key, detail = '') {
  state.statusKey = key;
  state.statusDetail = detail;
  refs.hint.textContent = text(key, detail);
}
function renderLanguage() {
  refs.name.textContent = state.contentTypeId ? `${text('selected')} ${state.contentTypeName}` : text('noType');
  renderEntryFields(refs.fields, state.fields, getEntryData(), currentMediaFiles());
  bulkController.render(state.items);
  renderEntriesList(refs.list, state.items, state.editingId, fillForm, deleteEntry, canPreviewEntries() ? previewEntry : null, !state.contentTypeId, canWriteEntries(), bulkController.getSelectedIds(), bulkController.toggleEntry);
  applyPermissions(refs.form);
  setStatus(state.statusKey, state.statusDetail);
}
async function selectContentType(id, name, resetPage = false) {
  state.contentTypeId = id;
  state.contentTypeName = name;
  state.editingId = '';
  refs.id.value = '';
  refs.name.textContent = id ? `${text('selected')} ${name}` : text('noType');
  if (!id) {
    clearSelection();
    return;
  }
  if (resetPage && getEntriesQuery().page !== 1) {
    setEntriesQuery({ page: 1 });
    return;
  }
  await loadEntries();
}
async function loadEntries() {
  setStatus('loading');
  const filter = getEntriesStatusFilter();
  const [fieldsResponse, entriesResponse] = await Promise.all([
    apiFetch(`/api/content-types/${encodeURIComponent(state.contentTypeId)}/fields`),
    apiFetch(buildEntriesRequestUrl(state.contentTypeId, filter)),
  ]);

  if (!fieldsResponse.ok || !entriesResponse.ok) {
    setStatus('loadFailed');
    return;
  }

  const fieldsData = await fieldsResponse.json();
  const entriesData = await entriesResponse.json();
  state.fields = Array.isArray(fieldsData.items) ? fieldsData.items : [];
  state.items = Array.isArray(entriesData.items) ? entriesData.items : [];
  bulkController.clearSelection();
  bulkController.render(state.items);
  resetForm();
  renderEntriesList(refs.list, state.items, state.editingId, fillForm, deleteEntry, canPreviewEntries() ? previewEntry : null, false, canWriteEntries(), bulkController.getSelectedIds(), bulkController.toggleEntry);
  versionsPanel.clear();
  renderQueryMeta({
    page: Number(entriesData.page ?? 1),
    pages: Number(entriesData.pages ?? 0),
    pendingApproval: Number(entriesData.counts?.pendingApproval ?? 0),
    total: Number(entriesData.total ?? state.items.length),
  });
  setStatus('itemCount', String(entriesData.total ?? state.items.length));
  applyPendingEntrySelection();
}

function clearSelection() {
  state.contentTypeId = '';
  state.contentTypeName = '';
  state.editingId = '';
  state.pendingEntryId = '';
  state.fields = [];
  state.items = [];
  refs.id.value = '';
  refs.name.textContent = text('noType');
  bulkController.clearSelection();
  bulkController.render(state.items);
  resetForm();
  renderEntriesList(refs.list, state.items, state.editingId, fillForm, deleteEntry, canPreviewEntries() ? previewEntry : null, true, canWriteEntries(), bulkController.getSelectedIds(), bulkController.toggleEntry);
  versionsPanel.clear();
  renderQueryMeta({ page: 1, pages: 0, pendingApproval: 0, total: 0 });
  setStatus('ready');
}

function fillForm(item) {
  state.editingId = item.id;
  refs.id.value = item.id;
  refs.status.value = item.status ?? 'draft';
  refs.publishAt.value = toLocalDatetimeValue(item.publishAt);
  renderEntryFields(refs.fields, state.fields, item.data ?? {}, currentMediaFiles());
  bulkController.render(state.items);
  applyPermissions(refs.form);
  syncPublishAtState(refs.status, refs.publishAt);
  void versionsPanel.load();
  setStatus('editing', item.id);
  renderEntriesList(refs.list, state.items, state.editingId, fillForm, deleteEntry, false, canWriteEntries(), bulkController.getSelectedIds(), bulkController.toggleEntry);
}

function resetForm() {
  state.editingId = '';
  refs.id.value = '';
  refs.status.value = 'draft';
  refs.publishAt.value = '';
  renderEntryFields(refs.fields, state.fields, {}, currentMediaFiles());
  bulkController.render(state.items);
  applyPermissions(refs.form);
  syncPublishAtState(refs.status, refs.publishAt);
  versionsPanel.clear();
  setStatus(state.contentTypeId ? 'ready' : 'selectType');
}

function getEntryData() {
  return collectEntryData(refs.fields, state.fields);
}

async function submitEntry(event) {
  event.preventDefault();

  if (!state.contentTypeId) {
    setStatus('selectFirst');
    return;
  }

  if (!canWriteEntries()) {
    setStatus('readOnly');
    return;
  }

  const data = getEntryData();
  const missingField = validateEntryData(state.fields, data);

  if (missingField) {
    setStatus('requiredField', missingField.label);
    return;
  }

  const publishAt = refs.status.value === 'scheduled' ? normalizePublishAt(refs.publishAt.value) : null;

  if (refs.status.value === 'scheduled' && !publishAt) {
    setStatus('publishAtRequired');
    return;
  }

  const payload = { data, publishAt, status: refs.status.value };
  const method = state.editingId ? 'PUT' : 'POST';
  const url = state.editingId
    ? `/api/content-types/${encodeURIComponent(state.contentTypeId)}/entries/${encodeURIComponent(state.editingId)}`
    : `/api/content-types/${encodeURIComponent(state.contentTypeId)}/entries`;

  setStatus(state.editingId ? 'updating' : 'saving');
  const response = await apiFetch(url, {
    body: JSON.stringify(payload),
    headers: { 'content-type': 'application/json' },
    method,
  });

  if (!response.ok) {
    setStatus('saveFailed');
    return;
  }

  const saved = await response.json().catch(() => ({}));
  await selectContentType(state.contentTypeId, state.contentTypeName);
  const savedId = typeof saved?.id === 'string' ? saved.id : state.editingId;
  const refreshed = state.items.find((item) => item.id === savedId);

  if (refreshed) {
    fillForm(refreshed);
  }
}

async function deleteEntry(entryId) {
  if (!canWriteEntries()) { setStatus('readOnly'); return; }
  setStatus('deleting');
  const response = await apiFetch(`/api/content-types/${encodeURIComponent(state.contentTypeId)}/entries/${encodeURIComponent(entryId)}`, { method: 'DELETE' });
  if (!response.ok && response.status !== 204) { setStatus('deleteFailed'); return; }
  if (state.editingId === entryId) { resetForm(); }
  await selectContentType(state.contentTypeId, state.contentTypeName);
}
function applyPendingEntrySelection() {
  const item = state.pendingEntryId ? state.items.find((entry) => entry.id === state.pendingEntryId) : null;
  if (!item) { return; }
  state.pendingEntryId = '';
  fillForm(item);
}
