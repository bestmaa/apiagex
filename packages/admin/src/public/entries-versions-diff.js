export function buildVersionComparison(fields, current, version) {
  const rows = [];

  pushRow(rows, 'status', 'Status', current?.status, version?.status, false);
  pushRow(rows, 'publishAt', 'Publish at', current?.publishAt, version?.publishAt, false);

  for (const field of fields) {
    const currentValue = current?.data?.[field.key];
    const versionValue = version?.data?.[field.key];
    const repeatable = Boolean(field.repeatable);

    if (!isSameValue(currentValue, versionValue, repeatable)) {
      rows.push({
        current: formatValue(currentValue, repeatable),
        label: field.label || field.key,
        version: formatValue(versionValue, repeatable),
      });
    }
  }

  return rows;
}

function pushRow(rows, key, label, currentValue, versionValue, repeatable) {
  if (isSameValue(currentValue, versionValue, repeatable)) {
    return;
  }

  rows.push({
    current: formatValue(currentValue, repeatable),
    key,
    label,
    version: formatValue(versionValue, repeatable),
  });
}

function isSameValue(currentValue, versionValue, repeatable) {
  return normalizeValue(currentValue, repeatable) === normalizeValue(versionValue, repeatable);
}

function normalizeValue(value, repeatable) {
  if (repeatable) {
    const values = Array.isArray(value) ? value : value === null || value === undefined || value === '' ? [] : [value];
    return JSON.stringify(values.map((item) => normalizeValue(item, false)));
  }

  if (value === null || value === undefined || value === '') {
    return '';
  }

  if (Array.isArray(value)) {
    return JSON.stringify(value.map((item) => normalizeValue(item, false)));
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }

  return String(value);
}

function formatValue(value, repeatable) {
  if (repeatable) {
    const values = Array.isArray(value) ? value : value === null || value === undefined || value === '' ? [] : [value];
    return values.length ? values.map((item) => formatValue(item, false)).join(', ') : '—';
  }

  if (value === null || value === undefined || value === '') {
    return '—';
  }

  if (Array.isArray(value)) {
    return value.length ? value.map((item) => formatValue(item, false)).join(', ') : '—';
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }

  return String(value);
}
