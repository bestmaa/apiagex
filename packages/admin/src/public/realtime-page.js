import {
  buildRealtimeStreamUrl,
  getRealtimeSelectedLabel,
  getRealtimeStatusLabel,
  normalizeRealtimeEvent,
  renderRealtimeEvents,
  renderRealtimeTypes,
} from './realtime-page.view.js';
import { createRealtimeClient } from './realtime.js';

export function createRealtimePage(apiFetch) {
  const state = {
    events: [],
    items: [],
    loaded: false,
    selectedId: '',
    status: 'disconnected',
    streamUrl: '',
  };

  const refs = {
    activeStreamUrl: document.getElementById('realtime-active-stream'),
    connectionStatus: document.getElementById('realtime-connection-status'),
    events: document.getElementById('realtime-events'),
    selected: document.getElementById('realtime-selected'),
    streamExample: document.getElementById('realtime-stream-example'),
    types: document.getElementById('realtime-types'),
  };

  let client = null;

  init();

  return {
    clear,
    load,
    reset,
  };

  function init() {
    refs.types?.addEventListener('click', handleTypeClick);
    window.addEventListener('apiagex:content-type-deleted', handleContentTypeDeleted);
    window.addEventListener('apiagex:language-changed', render);
    render();
  }

  function clear() {
    state.events = [];
    state.items = [];
    state.loaded = false;
    state.selectedId = '';
    state.status = 'disconnected';
    state.streamUrl = '';
    closeClient();
    render();
  }

  function reset() {
    clear();
  }

  async function load() {
    const response = await apiFetch('/api/content-types');

    if (!response.ok) {
      state.items = [];
      state.loaded = true;
      closeClient();
      state.status = 'disconnected';
      state.streamUrl = '';
      render();
      return;
    }

    const data = await response.json();
    state.items = Array.isArray(data.items) ? data.items : [];
    state.loaded = true;

    const previousId = state.selectedId;
    const selected = resolveSelectedItem();

    if (selected) {
      const nextUrl = buildRealtimeStreamUrl(selected);
      const shouldReconnect = !client || state.streamUrl !== nextUrl || previousId !== selected.id;

      if (previousId !== selected.id) {
        state.events = [];
      }

      state.selectedId = selected.id;

      if (shouldReconnect) {
        connect(selected, nextUrl);
      } else {
        render();
      }
    } else {
      state.selectedId = '';
      state.events = [];
      closeClient();
      state.status = 'disconnected';
      state.streamUrl = '';
    }

    render();
  }

  function handleContentTypeDeleted(event) {
    const id = typeof (event.detail ?? {}).id === 'string' ? event.detail.id : '';

    if (!id) {
      return;
    }

    if (state.selectedId === id) {
      state.selectedId = '';
      state.events = [];
    }

    void load();
  }

  function handleTypeClick(event) {
    const button = event.target.closest('[data-content-type-id]');

    if (!button) {
      return;
    }

    const id = button.dataset.contentTypeId ?? '';
    if (!id || id === state.selectedId) {
      return;
    }

    const selected = state.items.find((item) => item.id === id);
    if (!selected) {
      return;
    }

    state.selectedId = selected.id;
    state.events = [];
    connect(selected);
    render();
  }

  function resolveSelectedItem() {
    if (!state.items.length) {
      return null;
    }

    const current = state.items.find((item) => item.id === state.selectedId);
    return current ?? state.items[0] ?? null;
  }

  function connect(item, url = buildRealtimeStreamUrl(item)) {
    closeClient();

    state.streamUrl = url;
    state.status = 'connecting';
    render();

    client = createRealtimeClient({
      onEvent: handleEvent,
      onStatus: setStatus,
      url,
    });
    client.connect();
  }

  function closeClient() {
    if (client) {
      client.close();
      client = null;
    }
  }

  function handleEvent(detail) {
    if (!detail || typeof detail !== 'object') {
      return;
    }

    state.events = [normalizeRealtimeEvent(detail), ...state.events].slice(0, 20);
    render();
  }

  function render() {
    if (refs.streamExample) {
      refs.streamExample.textContent = '/realtime/stream?contentTypes=slug';
    }

    if (refs.connectionStatus) {
      refs.connectionStatus.textContent = getRealtimeStatusLabel(state.status);
    }

    if (refs.activeStreamUrl) {
      refs.activeStreamUrl.textContent = state.streamUrl || '/realtime/stream?contentTypes=slug';
    }

    if (refs.selected) {
      refs.selected.textContent = getRealtimeSelectedLabel(state.items, state.selectedId);
    }

    if (refs.types) {
      refs.types.innerHTML = renderRealtimeTypes({
        items: state.items,
        loaded: state.loaded,
        selectedId: state.selectedId,
      });
    }

    if (refs.events) {
      refs.events.innerHTML = renderRealtimeEvents({
        events: state.events,
        selectedId: state.selectedId,
      });
    }
  }

  function setStatus(value) {
    state.status = value;
    render();
  }
}
