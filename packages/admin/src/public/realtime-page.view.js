import { escapeHtml } from './content-types-access.js';
import { translations } from './app-i18n.js';

export function renderRealtimeTypes({ items, loaded, selectedId }) {
  if (!loaded) {
    return `<p class="muted">${escapeHtml(text('loading'))}</p>`;
  }

  if (!items.length) {
    return `<p class="muted">${escapeHtml(text('empty'))}</p>`;
  }

  return items
    .map((item) => {
      const realtime = readRealtimeState(item);
      const isSelected = item.id === selectedId;

      return `
        <button
          type="button"
          class="item realtime-type${isSelected ? ' selected' : ''}"
          data-content-type-id="${escapeHtml(item.id)}"
        >
          <div class="item-head">
            <strong>${escapeHtml(item.displayName)}</strong>
            <span class="badge">${escapeHtml(item.kind)}</span>
          </div>
          <div class="item-meta">
            <span>${escapeHtml(item.slug)}</span>
            <span class="entry-field-badges">
              <span class="badge">${escapeHtml(text('realtimeMaster'))}: ${escapeHtml(realtimeEnabledLabel(realtime.realtimeEnabled))}</span>
              <span class="badge">${escapeHtml(text('realtimeCreate'))}: ${escapeHtml(realtimeEnabledLabel(realtime.actions.create))}</span>
              <span class="badge">${escapeHtml(text('realtimeUpdate'))}: ${escapeHtml(realtimeEnabledLabel(realtime.actions.update))}</span>
              <span class="badge">${escapeHtml(text('realtimeDelete'))}: ${escapeHtml(realtimeEnabledLabel(realtime.actions.delete))}</span>
            </span>
          </div>
        </button>
      `;
    })
    .join('');
}

export function renderRealtimeEvents({ events, selectedId }) {
  if (!selectedId) {
    return `<p class="muted">${escapeHtml(text('realtimeSelectHint'))}</p>`;
  }

  if (!events.length) {
    return `<p class="muted">${escapeHtml(text('empty'))}</p>`;
  }

  return events
    .map((event) => {
      const details = JSON.stringify(event.details, null, 2);

      return `
        <article class="audit-row realtime-event">
          <div class="item-head">
            <strong>${escapeHtml(event.action)}</strong>
            <span class="badge">${escapeHtml(event.scope || text('realtimeLabel'))}</span>
          </div>
          <div class="item-meta">
            <span>${escapeHtml(event.createdAt || '')}</span>
            <span>${escapeHtml(event.contentTypeSlug || '')}</span>
            <span>${escapeHtml(event.subjectId || '')}</span>
          </div>
          <pre>${escapeHtml(details)}</pre>
        </article>
      `;
    })
    .join('');
}

export function normalizeRealtimeEvent(detail) {
  return {
    action: typeof detail.action === 'string' ? detail.action : 'update',
    contentTypeSlug: typeof detail.contentTypeSlug === 'string' ? detail.contentTypeSlug : '',
    createdAt: typeof detail.createdAt === 'string' ? detail.createdAt : '',
    details: detail.details && typeof detail.details === 'object' ? detail.details : {},
    name: typeof detail.name === 'string' ? detail.name : '',
    scope: typeof detail.scope === 'string' ? detail.scope : '',
    subjectId: typeof detail.subjectId === 'string' ? detail.subjectId : '',
    targets: Array.isArray(detail.targets) ? detail.targets.filter((value) => typeof value === 'string') : [],
  };
}

export function readRealtimeState(item) {
  const actions = item.realtimeActions ?? {};
  const fallback = Boolean(item.realtimeEnabled);

  return {
    actions: {
      create: typeof actions.create === 'boolean' ? actions.create : fallback,
      delete: typeof actions.delete === 'boolean' ? actions.delete : fallback,
      update: typeof actions.update === 'boolean' ? actions.update : fallback,
    },
    realtimeEnabled: fallback,
  };
}

export function getRealtimeStatusLabel(status) {
  const dictionary = translations[document.documentElement.lang === 'hi' ? 'hi' : 'en'] ?? translations.en;

  if (status === 'connecting') {
    return dictionary.realtimeStatusConnecting ?? status;
  }

  if (status === 'connected') {
    return dictionary.realtimeStatusConnected ?? status;
  }

  if (status === 'loading') {
    return dictionary.loading ?? status;
  }

  return dictionary.realtimeStatusDisconnected ?? status;
}

export function getRealtimeSelectedLabel(items, selectedId) {
  const item = items.find((entry) => entry.id === selectedId);

  if (!item) {
    return text('realtimeSelectHint');
  }

  return `${text('realtimeContentTypes')}: ${item.displayName} (${item.slug})`;
}

export function buildRealtimeStreamUrl(item) {
  return `/realtime/stream?contentTypes=${encodeURIComponent(item.slug)}`;
}

function text(key) {
  const language = document.documentElement.lang === 'hi' ? 'hi' : 'en';
  return translations[language][key] ?? translations.en[key] ?? key;
}

function realtimeEnabledLabel(enabled) {
  return enabled ? text('enabled') : text('disabled');
}
