import { getSession } from './session.js';

export function handleRoleListClick(event, state, fillForm, deleteRole) {
  const button = event.target.closest('button');
  const card = event.target.closest('[data-role-id]');

  if (!button || !card) {
    return;
  }

  const id = card.dataset.roleId ?? '';
  const role = state.items.find((item) => item.id === id);

  if (!role) {
    return;
  }

  if (button.dataset.action === 'edit') {
    fillForm(role);
    return;
  }

  if (button.dataset.action === 'delete') {
    void deleteRole(role);
  }
}

export function handleRoleMatrixChange(event, state, ensureMatrixScope) {
  const input = event.target.closest('input[type="checkbox"][data-scope-name][data-action-name]');

  if (!input) {
    return;
  }

  const scope = input.dataset.scopeName ?? '';
  const action = input.dataset.actionName ?? '';

  if (!scope || !action) {
    return;
  }

  ensureMatrixScope(state.currentPermissions, scope);
  state.currentPermissions[scope][action] = input.checked;
}

export function fillRoleForm(role, state, refs, splitPreservedPermissions, splitCurrentPermissions, setStatus, render) {
  state.editingId = role.id;
  state.preservedPermissions = splitPreservedPermissions(state.contentTypes, role.permissions);
  state.currentPermissions = splitCurrentPermissions(state.contentTypes, role.permissions);
  refs.id.value = role.id;
  refs.name.value = role.name;
  refs.description.value = role.description ?? '';
  setStatus('rolesStatusReady');
  render();
}

export function resetRoleForm(state, refs, createDefaultMatrixPermissions, setStatus, render) {
  state.editingId = '';
  state.preservedPermissions = {};
  state.currentPermissions = createDefaultMatrixPermissions(state.contentTypes);
  refs.id.value = '';
  refs.id.disabled = false;
  refs.name.value = '';
  refs.description.value = '';
  setStatus('rolesStatusReady');
  render();
}

export async function submitRoleForm(
  event,
  apiFetch,
  state,
  refs,
  load,
  fillForm,
  resetForm,
  buildPermissionsPayload,
  canManageRoles,
  setStatus,
  render,
) {
  event.preventDefault();

  if (!canManageRoles(getSession().role)) {
    return;
  }

  const id = refs.id.value.trim();
  const name = refs.name.value.trim();
  const description = refs.description.value.trim();

  if (!id || !name) {
    setStatus('rolesSaveFailed');
    return;
  }

  const payload = {
    description,
    id: state.editingId || id,
    name,
    permissions: buildPermissionsPayload(state.contentTypes, state.preservedPermissions, state.currentPermissions),
  };
  const method = state.editingId ? 'PUT' : 'POST';
  const url = state.editingId ? `/api/roles/${encodeURIComponent(state.editingId)}` : '/api/roles';

  setStatus('loading');
  const response = await apiFetch(url, {
    body: JSON.stringify(payload),
    headers: { 'content-type': 'application/json' },
    method,
  });

  if (!response.ok) {
    setStatus('rolesSaveFailed');
    render();
    return;
  }

  const record = await response.json().catch(() => null);
  await load();

  if (record && typeof record.id === 'string') {
    const selected = state.items.find((item) => item.id === record.id);
    if (selected) {
      fillForm(selected);
    }
  } else {
    resetForm();
  }

  setStatus('rolesSaved');
  render();
}

export async function deleteRoleRecord(
  role,
  apiFetch,
  state,
  resetForm,
  load,
  canManageRoles,
  setStatus,
  render,
) {
  if (!canManageRoles(getSession().role)) {
    return;
  }

  setStatus('loading');
  const response = await apiFetch(`/api/roles/${encodeURIComponent(role.id)}`, { method: 'DELETE' });

  if (!response.ok && response.status !== 204) {
    setStatus('rolesDeleteFailed');
    render();
    return;
  }

  if (state.editingId === role.id) {
    resetForm();
  }

  setStatus('rolesDeleted');
  await load();
}
