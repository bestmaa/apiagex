import { canAccess } from './permissions.js';
import { getSession } from './session.js';

export function canWriteEntries() {
  return canAccess(getSession().role, 'content-entries', 'write');
}

export function canPreviewEntries() {
  return canAccess(getSession().role, 'content-entries', 'read');
}

export function applyPermissions(form) {
  const writable = canWriteEntries();

  form.querySelectorAll('input, select, button').forEach((control) => {
    control.disabled = !writable;
  });
}

export function currentMediaFiles() {
  return Array.isArray(window.apiagexMediaFiles) ? window.apiagexMediaFiles : [];
}

export function syncPublishAtState(statusControl, publishAtControl) {
  const scheduled = statusControl.value === 'scheduled';
  publishAtControl.required = scheduled;
  publishAtControl.disabled = !scheduled || !canWriteEntries();
}

export function normalizePublishAt(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function toLocalDatetimeValue(value) {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const offset = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function createPreviewEntryHandler(apiFetch, getState, setStatus) {
  return async function previewEntry(item) {
    const state = getState();

    if (!state.contentTypeId || !item?.id) {
      return;
    }

    setStatus('previewing');
    const response = await apiFetch(
      `/api/content-types/${encodeURIComponent(state.contentTypeId)}/entries/${encodeURIComponent(item.id)}/preview`,
      { method: 'POST' },
    );

    if (!response.ok) {
      setStatus('previewFailed');
      return;
    }

    const data = await response.json();
    if (typeof data.previewUrl !== 'string' || !data.previewUrl) {
      setStatus('previewFailed');
      return;
    }

    const opened = window.open(data.previewUrl, '_blank', 'noopener');
    if (!opened) {
      setStatus('previewFailed');
      return;
    }

    setStatus('itemCount', String(state.items.length));
  };
}

export function createVersionRestoreHandler(selectContentType, getState, fillForm, setStatus) {
  return async function handleVersionRestored(restored) {
    const state = getState();
    const entryId = typeof restored?.id === 'string' ? restored.id : state.editingId;

    if (!state.contentTypeId || !entryId) {
      return;
    }

    await selectContentType(state.contentTypeId, state.contentTypeName);
    const refreshed = state.items.find((item) => item.id === entryId);

    if (refreshed) {
      fillForm(refreshed);
    }

    if (restored?.id) {
      setStatus('entryWorkflowUpdated', restored.id);
    }
  };
}
