import {
  renderWebhookFilterActions,
  renderWebhookFilterContentTypes,
} from './webhooks-panel.view.js';

export function collectSelectedEvents(refs) {
  return Array.from(refs.events.querySelectorAll('input[type="checkbox"]'))
    .filter((checkbox) => checkbox.checked)
    .map((checkbox) => checkbox.value);
}

export function collectSelectedFilters(refs) {
  return {
    actions: Array.from(refs.filterActions.querySelectorAll('input[type="checkbox"][data-filter-action]'))
      .filter((checkbox) => checkbox.checked)
      .map((checkbox) => checkbox.dataset.filterAction)
      .filter(Boolean),
    contentTypeIds: Array.from(refs.filterContentTypes.querySelectorAll('input[type="checkbox"][data-filter-content-type-id]'))
      .filter((checkbox) => checkbox.checked)
      .map((checkbox) => checkbox.dataset.filterContentTypeId)
      .filter(Boolean),
  };
}

export function handleWebhookListClick(event, state, handlers) {
  const button = event.target.closest('button');
  const card = event.target.closest('[data-webhook-id]');

  if (!button || !card) {
    return;
  }

  const id = card.dataset.webhookId;

  if (button.dataset.action === 'edit') {
    handlers.fillForm(state.items.find((item) => item.id === id));
    return;
  }

  if (button.dataset.action === 'delete') {
    void handlers.deleteWebhook(id);
    return;
  }

  if (button.dataset.action === 'deliveries') {
    void handlers.selectWebhook(id);
  }
}

export function loadWebhookContentTypes(apiFetch, state, renderFilterControls) {
  return apiFetch('/api/content-types').then(async (response) => {
    if (!response.ok) {
      state.contentTypes = [];
      renderFilterControls();
      return;
    }

    const data = await response.json();
    state.contentTypes = Array.isArray(data.items) ? data.items : [];
    renderFilterControls();
  });
}

export function loadWebhookDeliveries(apiFetch, state, refs, id) {
  state.deliveriesLoaded = false;

  return apiFetch(`/api/webhooks/${encodeURIComponent(id)}/deliveries`).then(async (response) => {
    if (!response.ok) {
      state.deliveries = [];
      state.deliveriesLoaded = true;
      return { count: 0, ok: false };
    }

    const data = await response.json();
    state.deliveries = Array.isArray(data.items) ? data.items : [];
    state.deliveriesLoaded = true;
    return { count: state.deliveries.length, ok: true };
  });
}

export function normalizeSelectedFilters(filters) {
  const normalized = {
    actions: [],
    contentTypeIds: [],
  };

  if (filters && typeof filters === 'object') {
    if (Array.isArray(filters.actions)) {
      normalized.actions = filters.actions.filter((value) => typeof value === 'string');
    }

    if (Array.isArray(filters.contentTypeIds)) {
      normalized.contentTypeIds = filters.contentTypeIds.filter((value) => typeof value === 'string');
    }
  }

  return normalized;
}

export function renderWebhookFilterControls(refs, contentTypes, filters) {
  refs.filterContentTypes.innerHTML = renderWebhookFilterContentTypes(
    contentTypes,
    filters.contentTypeIds,
  );
  refs.filterActions.innerHTML = renderWebhookFilterActions(filters.actions);
}

export function resetWebhookForm(
  refs,
  state,
  renderFilterControls,
  syncSelectedEvents,
  syncSelectedFilters,
) {
  state.editingId = null;
  refs.id.value = '';
  refs.name.value = '';
  refs.target.value = '';
  refs.secret.value = '';
  refs.enabled.checked = true;
  syncSelectedEvents(refs, WEBHOOK_EVENTS);
  syncSelectedFilters(state, refs, { actions: [], contentTypeIds: [] }, renderFilterControls);
}

export function selectWebhook(state, id, loadDeliveries, render) {
  state.selectedId = id;
  return loadDeliveries(id).then(() => {
    render();
  });
}

export function syncSelectedEvents(refs, selected) {
  refs.events.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
    checkbox.checked = selected.includes(checkbox.value);
  });
}

export function syncSelectedFilters(state, refs, filters, renderFilterControls) {
  state.filters = normalizeSelectedFilters(filters);
  renderFilterControls(refs, state.contentTypes, state.filters);
}

export function fillWebhookForm(item, refs, state, renderFilterControls, syncSelectedEvents, syncSelectedFilters, setStatus) {
  if (!item) {
    return;
  }

  state.editingId = item.id;
  refs.id.value = item.id;
  refs.name.value = item.name;
  refs.target.value = item.targetUrl;
  refs.secret.value = item.secret || '';
  refs.enabled.checked = Boolean(item.enabled);
  syncSelectedEvents(refs, item.events);
  syncSelectedFilters(state, refs, item.filters, renderFilterControls);
  setStatus('updated');
}

export async function deleteWebhook(apiFetch, state, id, resetForm, load, setStatus) {
  const response = await apiFetch(`/api/webhooks/${encodeURIComponent(id)}`, { method: 'DELETE' });

  if (!response.ok && response.status !== 204) {
    setStatus('createFailed');
    return;
  }

  if (state.editingId === id) {
    resetForm();
  }

  if (state.selectedId === id) {
    state.selectedId = null;
    state.deliveries = [];
    state.deliveriesLoaded = false;
  }

  await load();
}

export const WEBHOOK_EVENTS = [
  'content-types.create',
  'content-types.update',
  'content-types.delete',
  'content-fields.create',
  'content-fields.update',
  'content-fields.delete',
  'content-entries.create',
  'content-entries.update',
  'content-entries.delete',
  'media-files.create',
  'media-files.update',
  'media-files.delete',
];
