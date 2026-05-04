import { text } from './webhooks-i18n.js';
import { renderWebhookDeliveries, renderWebhookEventCheckboxes, renderWebhookList } from './webhooks-panel.view.js';
import {
  collectSelectedEvents,
  collectSelectedFilters,
  deleteWebhook,
  fillWebhookForm,
  handleWebhookListClick,
  loadWebhookContentTypes,
  loadWebhookDeliveries,
  renderWebhookFilterControls,
  resetWebhookForm,
  selectWebhook,
  syncSelectedEvents,
  syncSelectedFilters,
} from './webhooks-panel.logic.js';
import { getSession } from './session.js';

export function createWebhooksPanel(apiFetch) {
  const state = {
    deliveries: [],
    deliveriesLoaded: false,
    editingId: null,
    contentTypes: [],
    items: [],
    loaded: false,
    filters: {
      actions: [],
      contentTypeIds: [],
    },
    selectedId: null,
    statusKey: 'empty',
  };

  const refs = {
    deliveries: document.getElementById('webhooks-deliveries'),
    deliveryStatus: document.getElementById('webhooks-delivery-status'),
    enabled: document.getElementById('webhooks-enabled'),
    filterActions: document.getElementById('webhooks-filter-actions'),
    filterContentTypes: document.getElementById('webhooks-filter-content-types'),
    events: document.getElementById('webhooks-events'),
    form: document.getElementById('webhooks-form'),
    id: document.getElementById('webhooks-id'),
    list: document.getElementById('webhooks-list'),
    name: document.getElementById('webhooks-name'),
    refresh: document.getElementById('webhooks-refresh'),
    reset: document.getElementById('webhooks-reset'),
    secret: document.getElementById('webhooks-secret'),
    shell: document.getElementById('webhooks-shell'),
    status: document.getElementById('webhooks-status'),
    target: document.getElementById('webhooks-target'),
  };

  init();

  return { clear, load };

  function init() {
    window.addEventListener('apiagex:language-changed', render);
    window.addEventListener('apiagex:session-expired', clear);
    refs.form.addEventListener('submit', submitForm);
    refs.refresh.addEventListener('click', () => {
      void load();
    });
    refs.reset.addEventListener('click', resetForm);
    refs.list.addEventListener('click', handleListClickFromDom);
    refs.filterContentTypes.addEventListener('change', handleFilterChange);
    refs.filterActions.addEventListener('change', handleFilterChange);
    refs.events.innerHTML = renderWebhookEventCheckboxes();
    renderFilterControls();
    resetForm();
  }

  function canRead() {
    return ['admin', 'owner'].includes(getSession().role);
  }

  function clear() {
    state.deliveries = [];
    state.deliveriesLoaded = false;
    state.editingId = null;
    state.contentTypes = [];
    state.items = [];
    state.loaded = false;
    state.filters = { actions: [], contentTypeIds: [] };
    state.selectedId = null;
    state.statusKey = 'empty';
    renderFilterControls();
    render();
  }

  async function load() {
    if (!canRead()) {
      clear();
      return;
    }

    setStatus('loading');
    render();

    await loadWebhookContentTypes(apiFetch, state, renderFilterControls);

    const response = await apiFetch('/api/webhooks');
    if (!response.ok) {
      setStatus('createFailed');
      render();
      return;
    }

    const data = await response.json();
    state.items = Array.isArray(data.items) ? data.items : [];
    state.loaded = true;
    setStatus(state.items.length ? 'updated' : 'empty');
    render();

    if (state.selectedId) {
      await loadDeliveries(state.selectedId);
      return;
    }

    if (state.items[0]) {
      await selectWebhook(state, state.items[0].id, loadDeliveries, render);
    }
  }

  function render() {
    const visible = canRead();
    refs.shell.classList.toggle('hidden', !visible);

    if (!visible) {
      refs.list.innerHTML = '';
      refs.deliveries.innerHTML = '';
      refs.status.textContent = '';
      refs.deliveryStatus.textContent = '';
      return;
    }

    refs.status.textContent = text(state.statusKey);
    renderFilterControls();
    refs.list.innerHTML = renderWebhookList(state.items, state.selectedId, state.loaded);
    refs.deliveries.innerHTML = renderWebhookDeliveries(
      state.deliveries,
      state.deliveriesLoaded,
      state.selectedId,
    );
  }

  async function submitForm(event) {
    event.preventDefault();

    if (!canRead()) {
      return;
    }

    const payload = {
      enabled: refs.enabled.checked,
      filters: collectSelectedFilters(refs),
      events: collectSelectedEvents(refs),
      name: refs.name.value.trim(),
      secret: refs.secret.value.trim(),
      targetUrl: refs.target.value.trim(),
    };

    const method = state.editingId ? 'PUT' : 'POST';
    const url = state.editingId ? `/api/webhooks/${encodeURIComponent(state.editingId)}` : '/api/webhooks';

    setStatus('loading');
    const response = await apiFetch(url, {
      body: JSON.stringify(payload),
      headers: { 'content-type': 'application/json' },
      method,
    });

    if (!response.ok) {
      setStatus('createFailed');
      render();
      return;
    }

    const record = await response.json();
    resetForm();
    setStatus('updated');
    await load();
    await selectWebhook(state, record.id, loadDeliveries, render);
  }

  async function deleteWebhookFromDom(id) {
    await deleteWebhook(apiFetch, state, id, resetForm, load, setStatus);
  }

  async function loadDeliveries(id) {
    state.deliveriesLoaded = false;
    render();

    const result = await loadWebhookDeliveries(apiFetch, state, refs, id);

    if (state.selectedId !== id) {
      return;
    }

    refs.deliveryStatus.textContent = result?.ok
      ? text('deliveryItemCount', String(result.count))
      : text('deliveryLoadFailed');
    render();
  }

  function handleListClickFromDom(event) {
    handleWebhookListClick(event, state, {
      deleteWebhook: deleteWebhookFromDom,
      fillForm: (item) => fillWebhookForm(item, refs, state, renderFilterControls, syncSelectedEvents, syncSelectedFilters, setStatus),
      selectWebhook: (id) => selectWebhook(state, id, loadDeliveries, render),
    });
  }

  function handleFilterChange() {
    syncSelectedFilters(state, refs, collectSelectedFilters(refs), renderFilterControls);
  }

  function renderFilterControls() {
    renderWebhookFilterControls(refs, state.contentTypes, state.filters);
  }

  function resetForm() {
    resetWebhookForm(refs, state, renderFilterControls, syncSelectedEvents, syncSelectedFilters);
    setStatus('empty');
  }

  function setStatus(key) {
    state.statusKey = key;
  }
}
