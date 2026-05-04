import { canAccess } from './permissions.js';
import { getSession } from './session.js';

export function canWriteContentTypes() {
  return canAccess(getSession().role, 'content-types', 'write');
}

export function applyContentTypePermissions(form, addFieldButton) {
  const writable = canWriteContentTypes();

  addFieldButton.classList.toggle('hidden', !writable);
  form.querySelectorAll('input, select, button').forEach((control) => {
    control.disabled = !writable;
  });

  return writable;
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function formatContentTypePermissionsSummary(permissions) {
  if (!permissions || typeof permissions !== 'object') {
    return '';
  }

  const entries = [
    ['Create', permissions.create],
    ['Read', permissions.read],
    ['List', permissions.list],
    ['Update', permissions.update],
    ['Delete', permissions.delete],
  ];

  return entries
    .map(([label, value]) => `${label}: ${Array.isArray(value) && value.length ? value.join(', ') : 'none'}`)
    .join(' | ');
}
