import { translations } from './app-i18n.js';
import { renderRoleFormMode, renderRoleList, renderRoleMatrix } from './roles-panel.view.js';
import {
  deleteRoleRecord,
  fillRoleForm,
  handleRoleListClick,
  handleRoleMatrixChange,
  resetRoleForm,
  submitRoleForm,
} from './roles-panel.actions.js';
import {
  buildPermissionsPayload,
  canManageRoles,
  createDefaultMatrixPermissions,
  ensureMatrixScope,
  isBuiltInRole,
  splitCurrentPermissions,
  splitPreservedPermissions,
  summarizeRolePermissions,
} from './roles-panel.permissions.js';
import { getSession } from './session.js';

export function createRolesPanel(apiFetch) {
  const state = {
    contentTypes: [],
    editingId: '',
    items: [],
    loaded: false,
    preservedPermissions: {},
    statusKey: 'rolesStatusReady',
    currentPermissions: {},
  };

  const refs = {
    description: document.getElementById('role-description'),
    form: document.getElementById('roles-form'),
    formTitle: document.getElementById('roles-form-title'),
    id: document.getElementById('role-id'),
    list: document.getElementById('roles-list'),
    matrix: document.getElementById('roles-matrix'),
    name: document.getElementById('role-name'),
    reset: document.getElementById('roles-reset'),
    save: document.getElementById('roles-save'),
    shell: document.getElementById('roles-shell'),
    status: document.getElementById('roles-status'),
  };

  init();

  return {
    clear,
    load,
  };

  function init() {
    window.addEventListener('apiagex:language-changed', render);
    window.addEventListener('apiagex:session-expired', clear);
    refs.form?.addEventListener('submit', (event) =>
      submitRoleForm(
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
      ),
    );
    refs.reset?.addEventListener('click', () =>
      resetRoleForm(state, refs, createDefaultMatrixPermissions, setStatus, render),
    );
    refs.list?.addEventListener('click', (event) => handleRoleListClick(event, state, fillForm, deleteRole));
    refs.matrix?.addEventListener('change', (event) => handleRoleMatrixChange(event, state, ensureMatrixScope));
    resetRoleForm(state, refs, createDefaultMatrixPermissions, setStatus, render);
  }

  function clear() {
    state.contentTypes = [];
    state.editingId = '';
    state.items = [];
    state.loaded = false;
    state.preservedPermissions = {};
    state.statusKey = 'rolesStatusReady';
    state.currentPermissions = {};
    render();
  }

  async function load() {
    if (!canManageRoles(getSession().role)) {
      clear();
      return;
    }

    setStatus('loading');
    render();

    const [rolesResponse, contentTypesResponse] = await Promise.all([
      apiFetch('/api/roles'),
      apiFetch('/api/content-types'),
    ]);

    if (!rolesResponse.ok || !contentTypesResponse.ok) {
      state.items = [];
      state.contentTypes = [];
      state.loaded = true;
      setStatus('rolesLoadFailed');
      render();
      return;
    }

    const rolesData = await rolesResponse.json();
    const contentTypesData = await contentTypesResponse.json();
    state.items = Array.isArray(rolesData.items) ? rolesData.items : [];
    state.contentTypes = Array.isArray(contentTypesData.items) ? contentTypesData.items : [];
    state.loaded = true;

    if (state.editingId) {
      const selected = state.items.find((item) => item.id === state.editingId);
      if (selected) {
        fillForm(selected);
      } else {
        resetForm();
      }
    }

    setStatus(state.items.length ? 'rolesStatusReady' : 'rolesEmpty');
    render();
  }

  function render() {
    const visible = canManageRoles(getSession().role);
    refs.shell?.classList.toggle('hidden', !visible);

    if (!visible) {
      if (refs.list) {
        refs.list.innerHTML = '';
      }
      if (refs.matrix) {
        refs.matrix.innerHTML = '';
      }
      if (refs.status) {
        refs.status.textContent = '';
      }
      return;
    }

    renderRoleList({
      editingId: state.editingId,
      isBuiltInRole,
      items: state.items,
      loaded: state.loaded,
      list: refs.list,
      summarizeRolePermissions: (permissions) => summarizeRolePermissions(permissions, text('rolesNoPermissions')),
      text,
    });
    renderRoleMatrix({
      contentTypes: state.contentTypes,
      currentPermissions: state.currentPermissions,
      loaded: state.loaded,
      matrix: refs.matrix,
      text,
    });
    renderRoleFormMode({
      editingId: state.editingId,
      formTitle: refs.formTitle,
      id: refs.id,
      save: refs.save,
      text,
    });

    if (refs.status) {
      refs.status.textContent = text(state.statusKey);
    }
  }

  function fillForm(role) {
    fillRoleForm(role, state, refs, splitPreservedPermissions, splitCurrentPermissions, setStatus, render);
  }

  function resetForm() {
    resetRoleForm(state, refs, createDefaultMatrixPermissions, setStatus, render);
  }

  async function deleteRole(role) {
    await deleteRoleRecord(role, apiFetch, state, resetForm, load, canManageRoles, setStatus, render);
  }

  function setStatus(key) {
    state.statusKey = key;
  }
}

function text(key) {
  const language = document.documentElement.lang === 'hi' ? 'hi' : 'en';
  return translations[language][key] ?? translations.en[key] ?? key;
}
