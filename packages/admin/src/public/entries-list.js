import { text } from './entries-i18n.js';

export function renderEntriesList(
  container,
  items,
  editingId,
  onEdit,
  onDelete,
  onPreview,
  noType = false,
  writable = true,
  selectedIds = new Set(),
  onToggleSelect = null,
) {
  container.innerHTML = '';

  if (noType) {
    renderEmpty(container, text('selectType'));
    return;
  }

  if (!items.length) {
    renderEmpty(container, text('noEntries'));
    return;
  }

  for (const item of items) {
    const card = document.createElement('article');
    const selected = selectedIds.has(item.id);
    card.className = `item${editingId === item.id ? ' active' : ''}${selected ? ' selected' : ''}`;
    card.innerHTML = `
      <div class="item-head">
        <label class="item-select">
          <input type="checkbox" ${selected ? 'checked' : ''} aria-label="${escapeHtml(text('entriesSelectEntry'))}" data-action="select" />
        </label>
        <strong>${escapeHtml(item.id)}</strong>
        <span>${escapeHtml(renderStatus(item))}</span>
      </div>
      <div class="item-meta">${escapeHtml(stringifyMeta(item))}</div>
      <div class="item-actions">
        ${onPreview ? `<button type="button" class="ghost" data-action="preview">${escapeHtml(text('preview'))}</button>` : ''}
        ${writable ? `<button type="button" class="ghost" data-action="edit">${escapeHtml(text('edit'))}</button>` : ''}
        ${writable ? `<button type="button" class="ghost" data-action="delete">${escapeHtml(text('delete'))}</button>` : ''}
      </div>
    `;
    card.querySelector('[data-action="select"]')?.addEventListener('change', (event) => {
      onToggleSelect?.(item.id, Boolean(event.target?.checked));
    });
    card.querySelector('[data-action="preview"]')?.addEventListener('click', () => onPreview(item));
    card.querySelector('[data-action="edit"]')?.addEventListener('click', () => onEdit(item));
    card.querySelector('[data-action="delete"]')?.addEventListener('click', () => onDelete(item.id));
    container.appendChild(card);
  }
}

export function renderEmpty(container, message) {
  container.innerHTML = `<p class="muted">${escapeHtml(message)}</p>`;
}

function stringifyData(value) {
  try {
    return JSON.stringify(value);
  } catch {
    return '{}';
  }
}

function stringifyMeta(item) {
  const meta = [`data: ${stringifyData(item.data)}`];

  if (item.publishAt) {
    meta.push(`publishAt: ${item.publishAt}`);
  }

  return meta.join(' | ');
}

function renderStatus(item) {
  if (item.status === 'pendingApproval') {
    return text('entryStatusPendingApproval');
  }

  return item.status === 'scheduled' && item.publishAt
    ? `${item.status} @ ${item.publishAt}`
    : item.status;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
