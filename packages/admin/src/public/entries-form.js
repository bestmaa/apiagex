import { text } from './entries-i18n.js';

export function renderEntryFields(container, fields, entryData = {}, mediaFiles = []) {
  container.innerHTML = '';

  if (!fields.length) {
    container.innerHTML = `<p class="muted">${escapeHtml(text('noFields'))}</p>`;
    return;
  }

  for (const field of fields) {
    const wrapper = document.createElement('label');
    wrapper.className = 'entry-field';
    wrapper.dataset.fieldKey = field.key;
    wrapper.dataset.fieldType = field.type;
    wrapper.dataset.repeatable = String(field.repeatable);

    const head = document.createElement('div');
    head.className = 'entry-field-head';

    const title = document.createElement('span');
    title.textContent = field.required ? `${field.label} *` : field.label;
    head.appendChild(title);

    const badges = document.createElement('div');
    badges.className = 'entry-field-badges';
    badges.appendChild(createBadge(typeLabel(field.type)));
    if (field.required) {
      badges.appendChild(createBadge(text('required')));
    }
    if (field.repeatable) {
      badges.appendChild(createBadge(text('repeatable')));
    }
    head.appendChild(badges);
    wrapper.appendChild(head);

    const control = createControl(field, entryData[field.key], mediaFiles);
    control.classList.add('entry-field-control');
    wrapper.appendChild(control);

    if (field.repeatable) {
      const note = document.createElement('small');
      note.textContent = text('repeatableHint');
      wrapper.appendChild(note);
    }

    container.appendChild(wrapper);
  }
}

export function collectEntryData(container, fields) {
  const data = {};

  for (const field of fields) {
    const control = container.querySelector(`[data-field-key="${field.key}"] [data-role="control"]`);

    if (!control) {
      continue;
    }

    data[field.key] = readControlValue(field, control);
  }

  return data;
}

export function validateEntryData(fields, data) {
  for (const field of fields) {
    if (!field.required) {
      continue;
    }

    const value = data[field.key];

    if (field.repeatable && (!Array.isArray(value) || value.length === 0)) {
      return field;
    }

    if (field.type === 'boolean') {
      continue;
    }

    if (value === null || value === undefined || value === '') {
      return field;
    }
  }

  return null;
}

function createControl(field, value, mediaFiles) {
  if (field.repeatable) {
    const placeholder = field.type === 'relation' ? text('entryHintRelation') : text('entryHintRichtext');
    return makeTextarea(stringifyRepeatableValue(value), 5, placeholder);
  }

  if (field.type === 'boolean') {
    const control = document.createElement('input');
    control.type = 'checkbox';
    control.checked = Boolean(value);
    control.title = text('entryHintBoolean');
    control.dataset.role = 'control';
    return control;
  }

  if (field.type === 'number') {
    const control = document.createElement('input');
    control.type = 'number';
    control.value = value === undefined || value === null ? '' : String(value);
    control.inputMode = 'decimal';
    control.step = 'any';
    control.placeholder = '0';
    control.title = text('entryHintNumber');
    control.dataset.role = 'control';
    return control;
  }

  if (field.type === 'date') {
    const control = document.createElement('input');
    control.type = 'date';
    control.value = typeof value === 'string' ? value : '';
    control.title = text('entryHintDate');
    control.dataset.role = 'control';
    return control;
  }

  if (field.type === 'relation') {
    const control = document.createElement('input');
    control.type = 'text';
    control.value = value === undefined || value === null ? '' : String(value);
    control.placeholder = text('entryHintRelation');
    control.title = text('entryHintRelation');
    control.dataset.role = 'control';
    return control;
  }

  if (field.type === 'media') {
    const control = document.createElement('select');
    control.dataset.role = 'control';
    control.innerHTML = [
      '<option value="">Select media</option>',
      ...mediaFiles.map(
        (file) =>
          `<option value="${escapeHtml(file.id)}" ${file.id === value ? 'selected' : ''}>${escapeHtml(file.filename)}</option>`,
      ),
    ].join('');
    return control;
  }

  const placeholder =
    field.type === 'richtext' ? text('entryHintRichtext') : text('entryHintText');
  return makeTextarea(value === undefined || value === null ? '' : String(value), field.type === 'richtext' ? 8 : 4, placeholder);
}

function makeTextarea(value, rows, placeholder) {
  const control = document.createElement('textarea');
  control.rows = rows;
  control.value = value;
  control.placeholder = placeholder;
  control.dataset.role = 'control';
  return control;
}

function readControlValue(field, control) {
  if (field.repeatable) {
    return control.value
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  }

  if (field.type === 'boolean') {
    return control.checked;
  }

  if (field.type === 'number') {
    if (control.value === '') {
      return null;
    }

    const value = Number(control.value);
    return Number.isNaN(value) ? null : value;
  }

  if (field.type === 'relation') {
    if (field.repeatable) {
      return control.value
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
    }

    return control.value.trim();
  }

  return control.value;
}

function stringifyRepeatableValue(value) {
  return Array.isArray(value) ? value.map((item) => String(item)).join('\n') : '';
}

function createBadge(label) {
  const badge = document.createElement('span');
  badge.className = 'badge';
  badge.textContent = label;
  return badge;
}

function typeLabel(type) {
  switch (type) {
    case 'boolean':
      return text('fieldTypeBoolean');
    case 'date':
      return text('fieldTypeDate');
    case 'number':
      return text('fieldTypeNumber');
    case 'relation':
      return text('fieldTypeRelation');
    case 'media':
      return text('fieldTypeMedia');
    case 'richtext':
      return text('fieldTypeRichtext');
    default:
      return text('fieldTypeText');
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
