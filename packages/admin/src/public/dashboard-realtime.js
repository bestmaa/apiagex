import { createRealtimeClient } from './realtime.js';

export function createDashboardRealtime({
  auditPanel,
  loadMediaFiles,
  panel,
  refs,
  realtimePage,
  translations,
  webhooksPanel,
}) {
  const state = {
    realtimeStatus: 'disconnected',
    selectedContentType: null,
  };
  const realtime = createRealtimeClient({
    onEvent: handleRealtimeEvent,
    onStatus: setRealtimeStatus,
  });

  return {
    close: () => realtime.close(),
    connect: () => realtime.connect(),
    clearSelectedContentType,
    rememberSelectedContentType,
    renderRealtimeStatus,
    reset,
  };

  function reset() {
    state.realtimeStatus = 'disconnected';
    state.selectedContentType = null;
    renderRealtimeStatus();
  }

  function rememberSelectedContentType(event) {
    const detail = event.detail ?? {};
    const id = typeof detail.id === 'string' ? detail.id : '';

    state.selectedContentType = id
      ? {
          displayName: typeof detail.displayName === 'string' ? detail.displayName : id,
          id,
        }
      : null;
  }

  function clearSelectedContentType(event) {
    const id = typeof (event.detail ?? {}).id === 'string' ? event.detail.id : '';

    if (state.selectedContentType?.id === id) {
      state.selectedContentType = null;
    }
  }

  function handleRealtimeEvent(detail) {
    if (!detail || typeof detail !== 'object') {
      return;
    }

    const scope = typeof detail.scope === 'string' ? detail.scope : '';
    const targetId = resolveTargetContentTypeId(detail);
    const matchesSelected = Boolean(state.selectedContentType?.id && targetId && state.selectedContentType.id === targetId);

    if (scope === 'content-types' || scope === 'content-fields') {
      void panel.load();
      void realtimePage?.load();
      void auditPanel.load();
    }

    if ((scope === 'content-types' || scope === 'content-fields') && matchesSelected && detail.action !== 'delete') {
      dispatchSelectedContentTypeRefresh(detail);
    }

    if (scope === 'content-entries' && matchesSelected) {
      dispatchSelectedContentTypeRefresh(detail);
      void auditPanel.load();
    }

    if (scope === 'content-types' && matchesSelected && detail.action === 'delete') {
      window.dispatchEvent(new CustomEvent('apiagex:content-type-deleted', { detail: { id: targetId } }));
      state.selectedContentType = null;
    }

    if (scope === 'media-files') {
      void loadMediaFiles();
      void auditPanel.load();
    }

    if (scope === 'webhooks') {
      void webhooksPanel.load();
    }
  }

  function dispatchSelectedContentTypeRefresh(detail) {
    if (!state.selectedContentType?.id) {
      return;
    }

    window.dispatchEvent(
      new CustomEvent('apiagex:content-type-selected', {
        detail: {
          displayName:
            typeof detail?.details?.displayName === 'string'
              ? detail.details.displayName
              : state.selectedContentType.displayName,
          id: state.selectedContentType.id,
        },
      }),
    );
  }

  function resolveTargetContentTypeId(detail) {
    if (typeof detail.contentTypeId === 'string' && detail.contentTypeId) {
      return detail.contentTypeId;
    }

    if (typeof detail.contentTypeSlug === 'string' && detail.contentTypeSlug) {
      return detail.contentTypeSlug;
    }

    if (typeof detail.subjectId === 'string' && detail.subjectId) {
      return detail.subjectId;
    }

    const details = detail.details ?? {};
    if (typeof details.contentTypeId === 'string' && details.contentTypeId) {
      return details.contentTypeId;
    }

    return '';
  }

  function setRealtimeStatus(status) {
    state.realtimeStatus = status;
    renderRealtimeStatus();
  }

  function renderRealtimeStatus() {
    if (!refs.realtimeStatus) {
      return;
    }

    if (!refs.appShell || refs.appShell.classList.contains('hidden')) {
      refs.realtimeStatus.textContent = '';
      return;
    }

    const language = document.documentElement.lang === 'hi' ? 'hi' : 'en';
    const dictionary = translations[language] ?? translations.en;
    const statusKey =
      state.realtimeStatus === 'connected'
        ? 'realtimeStatusConnected'
        : state.realtimeStatus === 'connecting'
          ? 'realtimeStatusConnecting'
          : 'realtimeStatusDisconnected';

    refs.realtimeStatus.textContent = `${dictionary.realtimeLabel ?? 'Realtime'}: ${dictionary[statusKey] ?? state.realtimeStatus}`;
  }
}
