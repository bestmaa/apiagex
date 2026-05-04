import { translations } from './app-i18n.js';

const FIELD_TYPES = ['text', 'richtext', 'number', 'date', 'boolean', 'relation', 'media'];

export function createFieldRow(field = {}, contentTypes = []) {
  const row = document.createElement('div');
  row.className = 'field-row';
  row.dataset.targetContentTypeId = field.settings?.targetContentTypeId ?? '';
  row.innerHTML = `
    <div class="field-grid">
      <input data-key="key" placeholder="title" value="${escapeHtml(field.key ?? '')}" />
      <input data-key="label" placeholder="Title" value="${escapeHtml(field.label ?? '')}" />
      <select data-key="type">${FIELD_TYPES.map((option) => `<option value="${option}">${option}</option>`).join('')}</select>
      <input data-key="required" type="checkbox" ${field.required ? 'checked' : ''} />
      <input data-key="repeatable" type="checkbox" ${field.repeatable ? 'checked' : ''} />
      <input data-key="sortOrder" type="number" min="0" value="${Number.isFinite(field.sortOrder) ? field.sortOrder : 0}" />
      <button type="button" class="ghost" data-action="remove">Remove</button>
    </div>
    <div class="field-settings" data-role="relation-settings">
      <label>
        <span data-role="relation-label">Relation</span>
        <select data-key="targetContentTypeId"></select>
      </label>
      <small class="muted" data-role="relation-hint"></small>
    </div>
  `;

  row.querySelector('[data-key="key"]').value = field.key ?? '';
  row.querySelector('[data-key="label"]').value = field.label ?? '';
  row.querySelector('[data-key="type"]').value = field.type ?? 'text';
  row.querySelector('[data-key="targetContentTypeId"]').dataset.key = 'targetContentTypeId';
  row.querySelector('[data-action="remove"]').addEventListener('click', () => row.remove());
  row.querySelector('[data-key="type"]').addEventListener('change', () => syncFieldRow(row, contentTypes));
  syncFieldRow(row, contentTypes);

  return row;
}

export function collectFieldRows(container) {
  return [...container.querySelectorAll('.field-row')]
    .map((row, index) => {
      const type = row.querySelector('[data-key="type"]').value;
      const field = {
        key: row.querySelector('[data-key="key"]').value.trim(),
        label: row.querySelector('[data-key="label"]').value.trim(),
        required: row.querySelector('[data-key="required"]').checked,
        repeatable: row.querySelector('[data-key="repeatable"]').checked,
        sortOrder: Number.parseInt(row.querySelector('[data-key="sortOrder"]').value || `${index}`, 10),
        type,
      };
      const targetContentTypeId = row.querySelector('[data-key="targetContentTypeId"]').value.trim();

      if (type === 'relation' && targetContentTypeId) {
        field.settings = { targetContentTypeId };
      }

      return field;
    })
    .filter((field) => field.key && field.label);
}

export function refreshFieldRows(container, contentTypes = []) {
  container.querySelectorAll('.field-row').forEach((row) => syncFieldRow(row, contentTypes));
}

function syncFieldRow(row, contentTypes) {
  const type = row.querySelector('[data-key="type"]').value;
  const settings = row.querySelector('[data-role="relation-settings"]');
  const label = row.querySelector('[data-role="relation-label"]');
  const hint = row.querySelector('[data-role="relation-hint"]');
  const target = row.querySelector('[data-key="targetContentTypeId"]');
  const language = document.documentElement.lang === 'hi' ? 'hi' : 'en';
  const dictionary = translations[language] ?? translations.en;
  const currentTarget = target.value || row.dataset.targetContentTypeId || '';

  label.textContent = dictionary.relationField ?? 'Relation';
  hint.textContent = dictionary.relationHint ?? '';
  settings.hidden = type !== 'relation';
  target.innerHTML = buildTargetOptions(contentTypes, currentTarget);
  row.dataset.targetContentTypeId = target.value || '';
}

function buildTargetOptions(contentTypes, selectedValue) {
  const language = document.documentElement.lang === 'hi' ? 'hi' : 'en';
  const dictionary = translations[language] ?? translations.en;
  const options = [`<option value="">${escapeHtml(dictionary.targetContentType ?? 'Target content type')}</option>`];

  for (const item of contentTypes) {
    options.push(
      `<option value="${escapeHtml(item.id)}" ${item.id === selectedValue ? 'selected' : ''}>${escapeHtml(item.displayName)} (${escapeHtml(item.kind)})</option>`,
    );
  }

  return options.join('');
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
