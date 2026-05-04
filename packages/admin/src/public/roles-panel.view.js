import { escapeHtml } from './content-types-access.js';
import { ACTIONS } from './roles-panel.permissions.js';

export function renderRoleList({ editingId, isBuiltInRole, items, loaded, list, summarizeRolePermissions, text }) {
  if (!list) {
    return;
  }

  if (!loaded) {
    list.innerHTML = `<p class="muted">${escapeHtml(text('loading'))}</p>`;
    return;
  }

  if (!items.length) {
    list.innerHTML = `<p class="muted">${escapeHtml(text('rolesEmpty'))}</p>`;
    return;
  }

  list.innerHTML = items
    .map((item) => {
      const isEditing = editingId === item.id;
      const summary = summarizeRolePermissions(item.permissions);
      return `
        <article class="item${isEditing ? ' active' : ''}" data-role-id="${escapeHtml(item.id)}">
          <div class="item-head">
            <strong>${escapeHtml(item.name)}</strong>
          </div>
          <div class="item-meta">${escapeHtml(item.id)}</div>
          <p class="muted permissions-summary">${escapeHtml(item.description || text('empty'))}</p>
          <p class="muted permissions-summary">${escapeHtml(summary)}</p>
          <div class="item-actions">
            <button type="button" class="ghost" data-action="edit">${escapeHtml(text('edit'))}</button>
            <button type="button" class="ghost" data-action="delete" ${isBuiltInRole(item.id) ? 'disabled' : ''}>${escapeHtml(text('delete'))}</button>
          </div>
        </article>
      `;
    })
    .join('');
}

export function renderRoleMatrix({ contentTypes, currentPermissions, loaded, matrix, text }) {
  if (!matrix) {
    return;
  }

  if (!loaded) {
    matrix.innerHTML = `<tbody><tr><td colspan="6" class="muted">${escapeHtml(text('loading'))}</td></tr></tbody>`;
    return;
  }

  if (!contentTypes.length) {
    matrix.innerHTML = `<tbody><tr><td colspan="6" class="muted">${escapeHtml(text('empty'))}</td></tr></tbody>`;
    return;
  }

  const header = `
    <thead>
      <tr>
        <th>${escapeHtml(text('roleContentType'))}</th>
        ${ACTIONS.map((action) => `<th>${escapeHtml(text(`permission${capitalize(action)}`))}</th>`).join('')}
      </tr>
    </thead>
  `;
  const body = `
    <tbody>
      ${contentTypes.map((item) => renderRoleMatrixRow(item, currentPermissions)).join('')}
    </tbody>
  `;

  matrix.innerHTML = header + body;
}

export function renderRoleFormMode({ editingId, formTitle, id, save, text }) {
  if (!formTitle || !id || !save) {
    return;
  }

  formTitle.textContent = text(editingId ? 'rolesEditTitle' : 'rolesCreateTitle');
  save.textContent = text('roleSave');
  id.disabled = Boolean(editingId);
}

function renderRoleMatrixRow(contentType, currentPermissions) {
  const scope = `content-types:${contentType.id}`;
  const label = escapeHtml(contentType.displayName);
  const slug = escapeHtml(contentType.slug);

  return `
    <tr data-scope="${escapeHtml(scope)}">
      <th scope="row">
        <div>${label}</div>
        <div class="muted">${slug}</div>
      </th>
      ${ACTIONS.map((action) => renderRoleMatrixCell(scope, action, currentPermissions)).join('')}
    </tr>
  `;
}

function renderRoleMatrixCell(scope, action, currentPermissions) {
  const checked = Boolean(currentPermissions[scope]?.[action]);
  const id = `${scope}-${action}`.replaceAll(/[^a-zA-Z0-9_-]/g, '-');

  return `
    <td>
      <label class="switch-row permissions-toggle" for="${escapeHtml(id)}">
        <input id="${escapeHtml(id)}" type="checkbox" data-action-name="${escapeHtml(action)}" data-scope-name="${escapeHtml(scope)}" ${checked ? 'checked' : ''} />
        <span class="sr-only">${escapeHtml(action)}</span>
      </label>
    </td>
  `;
}

function capitalize(value) {
  return value ? value[0].toUpperCase() + value.slice(1) : value;
}
