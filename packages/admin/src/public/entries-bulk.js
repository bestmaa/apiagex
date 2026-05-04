import { getSession } from './session.js';
import { text } from './entries-i18n.js';

const refs = {
  approve: document.getElementById('entry-bulk-approve'),
  clear: document.getElementById('entry-bulk-clear'),
  count: document.getElementById('entry-bulk-count'),
  delete: document.getElementById('entry-bulk-delete'),
  publish: document.getElementById('entry-bulk-publish'),
  selectPage: document.getElementById('entry-bulk-select-page'),
  unpublish: document.getElementById('entry-bulk-unpublish'),
};

const state = {
  currentIds: [],
  selectedIds: new Set(),
};

export function createEntriesBulkController(apiFetch, getState, reloadEntries, setStatus) {
  init();

  return {
    clearSelection,
    getSelectedIds,
    isSelected,
    render,
    toggleEntry,
    togglePageSelection,
  };

  function init() {
    refs.clear?.addEventListener('click', clearSelection);
    refs.delete?.addEventListener('click', () => void runBulkDelete());
    refs.publish?.addEventListener('click', () => void runBulkStatus('published'));
    refs.unpublish?.addEventListener('click', () => void runBulkStatus('draft'));
    refs.approve?.addEventListener('click', () => void runBulkApprove());
    refs.selectPage?.addEventListener('change', () => togglePageSelection(Boolean(refs.selectPage?.checked)));
    sync();
  }

  function render(items) {
    state.currentIds = items.map((item) => item.id);
    sync();
  }

  function clearSelection() {
    state.selectedIds.clear();
    sync();
    emitChange();
  }

  function isSelected(id) {
    return state.selectedIds.has(id);
  }

  function getSelectedIds() {
    return new Set(state.selectedIds);
  }

  function toggleEntry(id, checked) {
    if (checked) {
      state.selectedIds.add(id);
    } else {
      state.selectedIds.delete(id);
    }

    sync();
    emitChange();
  }

  function togglePageSelection(checked) {
    if (checked) {
      state.currentIds.forEach((id) => state.selectedIds.add(id));
    } else {
      state.currentIds.forEach((id) => state.selectedIds.delete(id));
    }

    sync();
    emitChange();
  }

  async function runBulkApprove() {
    if (!isAdmin() || !hasSelection()) {
      return;
    }

    const selectedItems = getSelectedItems().filter((item) => item.status === 'pendingApproval');
    if (!selectedItems.length) {
      return;
    }

    setStatus('updating', String(selectedItems.length));
    const results = await Promise.all(selectedItems.map((item) => apiFetch(`/api/content-types/${encodeURIComponent(getState().contentTypeId)}/entries/${encodeURIComponent(item.id)}/approve`, { method: 'POST' })));
    if (results.some((response) => !response.ok)) {
      setStatus('approvalFailed');
      return;
    }
    clearSelection();
    await reloadEntries();
  }

  async function runBulkStatus(nextStatus) {
    if (!canWrite() || !hasSelection()) {
      return;
    }

    const selectedItems = getSelectedItems();
    if (!selectedItems.length) {
      return;
    }

    setStatus(nextStatus === 'published' ? 'saving' : 'updating', String(selectedItems.length));
    const results = await Promise.all(selectedItems.map((item) => apiFetch(
      `/api/content-types/${encodeURIComponent(getState().contentTypeId)}/entries/${encodeURIComponent(item.id)}`,
      {
        body: JSON.stringify({
          data: item.data ?? {},
          publishAt: null,
          status: nextStatus,
        }),
        headers: { 'content-type': 'application/json' },
        method: 'PUT',
      },
    )));
    if (results.some((response) => !response.ok)) {
      setStatus('saveFailed');
      return;
    }
    clearSelection();
    await reloadEntries();
  }

  async function runBulkDelete() {
    if (!canWrite() || !hasSelection()) {
      return;
    }

    const selectedItems = getSelectedItems();
    if (!selectedItems.length) {
      return;
    }

    setStatus('deleting', String(selectedItems.length));
    const results = await Promise.all(selectedItems.map((item) => apiFetch(
      `/api/content-types/${encodeURIComponent(getState().contentTypeId)}/entries/${encodeURIComponent(item.id)}`,
      { method: 'DELETE' },
    )));
    if (results.some((response) => !response.ok && response.status !== 204)) {
      setStatus('deleteFailed');
      return;
    }
    clearSelection();
    await reloadEntries();
  }

  function getSelectedItems() {
    const items = Array.isArray(getState().items) ? getState().items : [];
    return items.filter((item) => state.selectedIds.has(item.id));
  }

  function hasSelection() {
    return state.selectedIds.size > 0;
  }

  function canWrite() {
    return ['admin', 'editor', 'owner'].includes(getSession().role);
  }

  function isAdmin() {
    return ['admin', 'owner'].includes(getSession().role);
  }

  function sync() {
    const selectedCount = state.selectedIds.size;
    const pageSelected = state.currentIds.length > 0 && state.currentIds.every((id) => state.selectedIds.has(id));
    const pagePartial = !pageSelected && state.currentIds.some((id) => state.selectedIds.has(id));

    if (refs.selectPage) {
      refs.selectPage.checked = pageSelected;
      refs.selectPage.indeterminate = pagePartial;
      refs.selectPage.disabled = !state.currentIds.length;
    }

    if (refs.count) {
      refs.count.textContent = selectedCount ? text('entriesSelectedCount', String(selectedCount)) : '';
    }

    if (refs.clear) {
      refs.clear.disabled = !selectedCount;
    }

    if (refs.delete) {
      refs.delete.disabled = !selectedCount || !canWrite();
    }

    if (refs.publish) {
      refs.publish.disabled = !selectedCount || !canWrite();
    }

    if (refs.unpublish) {
      refs.unpublish.disabled = !selectedCount || !canWrite();
    }

    if (refs.approve) {
      refs.approve.hidden = !isAdmin();
      refs.approve.disabled = !selectedCount || !isAdmin();
    }
  }

  function emitChange() {
    window.dispatchEvent(new CustomEvent('apiagex:entries-bulk-changed'));
  }
}
