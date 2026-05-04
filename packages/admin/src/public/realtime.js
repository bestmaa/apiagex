export function createRealtimeClient(options = {}) {
  const factory = options.eventSourceFactory ?? ((url) => new EventSource(url));
  const url = options.url ?? '/realtime/stream';
  let source = null;

  return {
    close,
    connect,
  };

  function connect() {
    if (source) {
      return;
    }

    options.onStatus?.('connecting');
    source = factory(url);
    source.addEventListener('open', handleOpen);
    source.addEventListener('ready', handleReady);
    source.addEventListener('update', handleUpdate);
    source.addEventListener('error', handleError);
  }

  function close() {
    if (!source) {
      return;
    }

    source.close();
    source = null;
  }

  function handleOpen() {
    options.onStatus?.('connected');
  }

  function handleReady(event) {
    handleStatusEvent(event);
  }

  function handleUpdate(event) {
    handleStatusEvent(event);
    const detail = parseEvent(event);

    if (detail) {
      options.onEvent?.(detail);
    }
  }

  function handleError() {
    options.onStatus?.('disconnected');
  }

  function handleStatusEvent(event) {
    const detail = parseEvent(event);

    if (detail?.status === 'ok' || detail?.status === 'ready') {
      options.onStatus?.('connected');
    }
  }
}

function parseEvent(event) {
  try {
    return JSON.parse(event.data);
  } catch {
    return null;
  }
}
