import { escapeHtml } from './content-types-access.js';
import { text } from './webhooks-i18n.js';

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

export function renderWebhookList(items, selectedId, loaded) {
  if (!loaded) {
    return `<p class="muted">${escapeHtml(text('loading'))}</p>`;
  }

  if (!items.length) {
    return `<p class="muted">${escapeHtml(text('empty'))}</p>`;
  }

  return items
    .map(
      (item) => `
        <article class="webhook-item${selectedId === item.id ? ' active' : ''}" data-webhook-id="${escapeHtml(item.id)}">
          <div class="webhook-head">
            <strong>${escapeHtml(item.name)}</strong>
            <span class="badge">${escapeHtml(item.enabled ? text('enabled') : text('disabled'))}</span>
          </div>
          <small class="muted">${escapeHtml(item.targetUrl)}</small>
          <p class="webhook-events">${escapeHtml(item.events.join(', '))}</p>
          <div class="actions">
            <button type="button" class="ghost" data-action="deliveries">${escapeHtml(text('deliveries'))}</button>
            <button type="button" class="ghost" data-action="edit">${escapeHtml(text('edit'))}</button>
            <button type="button" class="ghost" data-action="delete">${escapeHtml(text('delete'))}</button>
          </div>
        </article>
      `,
    )
    .join('');
}

export function renderWebhookDeliveries(deliveries, deliveriesLoaded, selectedId) {
  if (!selectedId) {
    return `<p class="muted">${escapeHtml(text('deliveryHint'))}</p>`;
  }

  if (!deliveriesLoaded) {
    return `<p class="muted">${escapeHtml(text('deliveryLoading'))}</p>`;
  }

  if (!deliveries.length) {
    return `<p class="muted">${escapeHtml(text('empty'))}</p>`;
  }

  return `
    <div class="webhook-delivery-list">
      ${deliveries
        .map(
          (item) => `
            <article class="webhook-delivery">
              <div class="webhook-head">
                <strong>${escapeHtml(item.eventName)}</strong>
                <span class="badge">${escapeHtml(formatDeliveryBadge(item))}</span>
              </div>
              <small class="muted">${escapeHtml(item.createdAt)}</small>
              <div class="webhook-delivery-meta">
                <span>${escapeHtml(text('status'))}: ${escapeHtml(formatDeliveryStatus(item.status))}</span>
                <span>${escapeHtml(text('attempt'))}: ${escapeHtml(String(item.attempt ?? 1))}</span>
                ${item.nextRetryAt ? `<span>${escapeHtml(text('nextRetry'))}: ${escapeHtml(item.nextRetryAt)}</span>` : ''}
              </div>
              <pre>${escapeHtml(item.responseBody || item.errorMessage || '')}</pre>
            </article>
          `,
        )
        .join('')}
    </div>
  `;
}

export function renderWebhookEventCheckboxes() {
  return WEBHOOK_EVENTS.map(
    (eventName) => `
      <label class="checkbox-row">
        <input type="checkbox" value="${escapeHtml(eventName)}" checked />
        <span>${escapeHtml(eventName)}</span>
      </label>
    `,
  ).join('');
}

export function renderWebhookFilterContentTypes(contentTypes, selectedIds = []) {
  if (!contentTypes.length) {
    return `<p class="muted">${escapeHtml(text('filtersContentTypesEmpty'))}</p>`;
  }

  return contentTypes
    .map(
      (item) => `
        <label class="checkbox-row">
          <input type="checkbox" data-filter-content-type-id="${escapeHtml(item.slug || item.id)}" ${selectedIds.includes(item.slug || item.id) ? 'checked' : ''} />
          <span>${escapeHtml(item.displayName || item.slug || item.id)}</span>
        </label>
      `,
    )
    .join('');
}

export function renderWebhookFilterActions(selectedActions = []) {
  const actions = ['create', 'update', 'delete'];

  return actions
    .map(
      (action) => `
        <label class="checkbox-row">
          <input type="checkbox" data-filter-action="${escapeHtml(action)}" ${selectedActions.includes(action) ? 'checked' : ''} />
          <span>${escapeHtml(text(`filterAction${capitalize(action)}`))}</span>
        </label>
      `,
    )
    .join('');
}

function formatDeliveryBadge(item) {
  if (item.status === 'delivered') {
    return text('delivered');
  }

  if (item.status === 'retrying') {
    return text('retrying');
  }

  if (item.status === 'failed') {
    return text('failed');
  }

  return item.statusCode === null ? 'error' : String(item.statusCode);
}

function formatDeliveryStatus(status) {
  if (status === 'delivered') {
    return text('delivered');
  }

  if (status === 'retrying') {
    return text('retrying');
  }

  if (status === 'failed') {
    return text('failed');
  }

  return text('pending');
}

function capitalize(value) {
  return value ? value[0].toUpperCase() + value.slice(1) : value;
}
