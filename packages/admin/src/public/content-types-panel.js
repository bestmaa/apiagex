import { translations } from './app-i18n.js';
import {
  applyContentTypePermissions,
  canWriteContentTypes,
  escapeHtml,
  formatContentTypePermissionsSummary,
} from './content-types-access.js';
import { collectFieldRows, createFieldRow, refreshFieldRows } from './content-field-rows.js';
import {
  hasRealtimeActions,
  readRealtimeActions,
  readRealtimeActionsFromForm,
  setRealtimeActions,
  syncRealtimeControls,
} from './content-types-realtime.js';

export function createContentTypesPanel(apiFetch) {
  const state = {
    editingId: null,
    items: [],
  };

  const refs = {
    addField: document.getElementById('add-field'),
    contentForm: document.getElementById('content-form'),
    displayName: document.getElementById('display-name'),
    fields: document.getElementById('fields'),
    kind: document.getElementById('kind'),
    list: document.getElementById('list'),
    preview: document.getElementById('preview'),
    realtimeActions: document.getElementById('realtime-actions'),
    realtimeCreate: document.getElementById('realtime-create'),
    realtimeEnabled: document.getElementById('realtime-enabled'),
    realtimeDelete: document.getElementById('realtime-delete'),
    realtimeUpdate: document.getElementById('realtime-update'),
    reset: document.getElementById('content-form-reset'),
    slug: document.getElementById('slug'),
    status: document.getElementById('status'),
  };

  init();

  return {
    clear,
    load,
    reset: resetForm,
  };

  function init() {
    window.addEventListener('apiagex:language-changed', () => {
      refreshFieldRows(refs.fields, state.items);
      renderList();
    });
    refs.addField.addEventListener('click', () => addFieldRow());
    refs.realtimeEnabled.addEventListener('change', () => syncRealtimeControls(refs));
    refs.contentForm.addEventListener('submit', submitForm);
    refs.reset.addEventListener('click', resetForm);
    resetForm();
  }

  function currentLanguage() {
    return document.documentElement.lang === 'hi' ? 'hi' : 'en';
  }

  function entryLabel() {
    return translations[currentLanguage()].entries ?? translations.en.entries;
  }

  function clear() {
    state.editingId = null;
    state.items = [];
    refs.list.innerHTML = '';
    refs.preview.textContent = '[]';
    setStatus('Ready.');
  }

  function resetForm() {
    state.editingId = null;
    refs.contentForm.reset();
    refs.fields.innerHTML = '';
    addFieldRow();
    applyContentTypePermissions(refs.contentForm, refs.addField);
    refreshFieldRows(refs.fields, state.items);
    setRealtimeActions(refs, { create: false, delete: false, update: false });
    syncRealtimeControls(refs);
    setStatus('Ready.');
  }

  function addFieldRow(field = {}) {
    if (!canWriteContentTypes()) {
      return;
    }

    refs.fields.appendChild(createFieldRow(field, state.items));
    refreshFieldRows(refs.fields, state.items);
  }

  async function load() {
    setStatus('Loading...');
    const response = await apiFetch('/api/content-types');
    const data = await response.json();
    state.items = Array.isArray(data.items) ? data.items : [];
    applyContentTypePermissions(refs.contentForm, refs.addField);
    refreshFieldRows(refs.fields, state.items);
    syncRealtimeControls(refs);
    renderList();
    setStatus(`${state.items.length} item(s)`);
  }

  function renderList() {
    refs.list.innerHTML = '';
    refs.preview.textContent = JSON.stringify(state.items, null, 2);
    state.items.forEach((item) => {
      const card = document.createElement('article');
      card.className = `item${state.editingId === item.id ? ' active' : ''}`;
      card.innerHTML = `
        <div class="item-head">
          <strong>${escapeHtml(item.displayName)}</strong>
          <span class="entry-field-badges">
            <span class="badge">${escapeHtml(item.kind)}</span>
            ${hasRealtimeActions(item) ? `<span class="badge">${escapeHtml(realtimeLabel())}</span>` : ''}
          </span>
        </div>
        <div class="item-meta">${escapeHtml(item.slug)} - ${item.fields.length} field(s)</div>
        <p class="muted permissions-summary">${escapeHtml(formatContentTypePermissionsSummary(item.permissions))}</p>
        <div class="item-actions">
          <button type="button" class="ghost" data-action="entries">${entryLabel()}</button>
          ${canWriteContentTypes() ? `<button type="button" class="ghost" data-action="duplicate">${escapeHtml(translations[currentLanguage()].duplicate ?? 'Duplicate')}</button><button type="button" class="ghost" data-action="edit">Edit</button><button type="button" class="ghost" data-action="delete">Delete</button>` : ''}
        </div>
      `;
      card.querySelector('[data-action="edit"]')?.addEventListener('click', () => fillForm(item));
      card.querySelector('[data-action="entries"]').addEventListener('click', () =>
        window.dispatchEvent(
          new CustomEvent('apiagex:content-type-selected', {
            detail: { displayName: item.displayName, id: item.id },
          }),
        ),
      );
      card.querySelector('[data-action="duplicate"]')?.addEventListener('click', () => duplicateItem(item));
      card.querySelector('[data-action="delete"]')?.addEventListener('click', () => deleteItem(item.id));
      refs.list.appendChild(card);
    });
  }

  function fillForm(item) {
    state.editingId = item.id;
      refs.displayName.value = item.displayName;
      refs.slug.value = item.slug;
      refs.kind.value = item.kind;
      refs.fields.innerHTML = '';
      item.fields.forEach((field) => addFieldRow(field));
    applyContentTypePermissions(refs.contentForm, refs.addField);
    refs.realtimeEnabled.checked = Boolean(item.realtimeEnabled);
    setRealtimeActions(refs, readRealtimeActions(item));
    syncRealtimeControls(refs);
    refreshFieldRows(refs.fields, state.items);
    renderList();
    setStatus(`Editing ${item.slug}`);
  }

  async function submitForm(event) {
    event.preventDefault();

    if (!canWriteContentTypes()) {
      setStatus('Read-only access.');
      return;
    }

    const fields = collectFields();
    const contentType = await saveContentType();

    if (!contentType) {
      setStatus('Save failed.');
      return;
    }

    const fieldsSaved = await saveContentFields(contentType.id, fields);
    if (!fieldsSaved) {
      return;
    }

    resetForm();
    await load();
  }

  async function deleteItem(id) {
    if (!canWriteContentTypes()) {
      setStatus('Read-only access.');
      return;
    }

    setStatus('Deleting...');
    const response = await apiFetch(`/api/content-types/${encodeURIComponent(id)}`, { method: 'DELETE' });

    if (!response.ok && response.status !== 204) {
      setStatus('Delete failed.');
      return;
    }

    if (state.editingId === id) {
      resetForm();
    }

    window.dispatchEvent(new CustomEvent('apiagex:content-type-deleted', { detail: { id } }));
    await load();
  }

  async function duplicateItem(item) {
    if (!canWriteContentTypes()) {
      setStatus('Read-only access.');
      return;
    }

    const slug = window.prompt('Duplicate slug', `${item.slug}-copy`)?.trim();
    if (!slug) {
      return;
    }

    const displayName = window.prompt('Duplicate name', `${item.displayName} Copy`)?.trim() || `${item.displayName} Copy`;
    setStatus('Duplicating...');
    const response = await apiFetch(`/api/content-types/${encodeURIComponent(item.id)}/duplicate`, {
      body: JSON.stringify({ displayName, slug }),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    });

    if (!response.ok) {
      setStatus(response.status === 409 ? 'Slug already exists.' : 'Duplicate failed.');
      return;
    }

    await load();
  }

  function collectFields() {
    return collectFieldRows(refs.fields);
  }

  async function saveContentType() {
    const payload = {
      displayName: refs.displayName.value.trim(),
      fields: [],
      kind: refs.kind.value,
      realtimeActions: readRealtimeActionsFromForm(refs),
      realtimeEnabled: refs.realtimeEnabled.checked,
      slug: refs.slug.value.trim(),
    };
    const method = state.editingId ? 'PUT' : 'POST';
    const url = state.editingId ? `/api/content-types/${encodeURIComponent(state.editingId)}` : '/api/content-types';

    setStatus(state.editingId ? 'Updating...' : 'Saving...');
    const response = await apiFetch(url, {
      body: JSON.stringify(payload),
      headers: { 'content-type': 'application/json' },
      method,
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  }

  async function saveContentFields(contentTypeId, fields) {
    for (const field of fields) {
      const response = await apiFetch(`/api/content-types/${encodeURIComponent(contentTypeId)}/fields`, {
        body: JSON.stringify(field),
        headers: { 'content-type': 'application/json' },
        method: 'POST',
      });

      if (!response.ok) {
        setStatus('Field save failed.');
        return false;
      }
    }

    return true;
  }

  function setStatus(message) {
    refs.status.textContent = message;
  }

  function realtimeLabel() {
    return translations[currentLanguage()].realtimeBadge ?? translations.en.realtimeBadge;
  }
}
