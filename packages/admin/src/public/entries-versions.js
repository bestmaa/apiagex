import { canPreviewEntries, canWriteEntries } from './entries-helpers.js';
import { text } from './entries-i18n.js';
import { createEntryApprovalPanel } from './entries-approval.js';
import { buildVersionComparison } from './entries-versions-diff.js';

export function createEntryVersionsPanel(apiFetch, getState, getBaseline, onRestore) {
  const refs = {
    compare: document.getElementById('entry-versions-compare'),
    list: document.getElementById('entry-versions'),
    refresh: document.getElementById('entry-versions-refresh'),
    shell: document.getElementById('entry-versions-shell'),
    status: document.getElementById('entry-versions-status'),
  };

  const state = {
    items: [],
    compareVersionId: '',
    loadedFor: '',
  };
  const approvalPanel = createEntryApprovalPanel(apiFetch, getState, onRestore);

  init();

  return {
    clear,
    load,
  };

  function init() {
    window.addEventListener('apiagex:language-changed', render);
    refs.refresh.addEventListener('click', () => {
      void load();
    });
    render();
  }

  function clear() {
    state.items = [];
    state.compareVersionId = '';
    state.loadedFor = '';
    approvalPanel.clear();
    render();
  }

  async function load() {
    const current = getState();

    if (!current.contentTypeId || !current.editingId) {
      clear();
      return;
    }

    const key = `${current.contentTypeId}:${current.editingId}`;
    if (state.loadedFor === key && state.items.length) {
      render();
      return;
    }

    setStatus('loadingVersions');
    const response = await apiFetch(
      `/api/content-types/${encodeURIComponent(current.contentTypeId)}/entries/${encodeURIComponent(current.editingId)}/versions`,
    );

    if (!response.ok) {
      clear();
      setStatus('loadVersionsFailed');
      return;
    }

    const data = await response.json();
    state.items = Array.isArray(data.items) ? data.items : [];
    state.loadedFor = key;
    render();
    setStatus('versionsCount', String(state.items.length));
  }

  function render() {
    const current = getState();
    const visible = Boolean(current.contentTypeId && current.editingId);
    refs.shell.classList.toggle('hidden', !visible);

    if (!visible) {
      refs.compare.innerHTML = '';
      refs.compare.classList.add('hidden');
      refs.list.innerHTML = '';
      refs.status.textContent = '';
      approvalPanel.clear();
      return;
    }

    refs.status.textContent = state.items.length ? text('versionsCount', String(state.items.length)) : text('versionsHint');
    approvalPanel.render();
    refs.compare.innerHTML = renderCompare();
    refs.compare.classList.toggle('hidden', !state.compareVersionId);
    refs.list.innerHTML = state.items.length ? renderList() : `<p class="muted">${escapeHtml(text('versionsEmpty'))}</p>`;
    refs.list.querySelectorAll('[data-version-id]').forEach((button) => {
      button.addEventListener('click', () => {
        const versionId = button.dataset.versionId;

        if (!versionId) {
          return;
        }

        void restore(versionId);
      });
    });
    refs.list.querySelectorAll('[data-version-compare-id]').forEach((button) => {
      button.addEventListener('click', () => {
        const versionId = button.dataset.versionCompareId;

        if (!versionId) {
          return;
        }

        state.compareVersionId = state.compareVersionId === versionId ? '' : versionId;
        render();
      });
    });
    refs.compare.querySelectorAll('[data-version-close-compare]').forEach((button) => {
      button.addEventListener('click', () => {
        state.compareVersionId = '';
        render();
      });
    });
  }

  async function restore(versionId) {
    const current = getState();

    if (!current.contentTypeId || !current.editingId) {
      return;
    }

    setStatus('restoringVersion');
    const response = await apiFetch(
      `/api/content-types/${encodeURIComponent(current.contentTypeId)}/entries/${encodeURIComponent(current.editingId)}/versions/${encodeURIComponent(versionId)}/restore`,
      { method: 'POST' },
    );

    if (!response.ok) {
      setStatus('restoreVersionFailed');
      return;
    }

    const restored = await response.json().catch(() => null);
    await onRestore?.(restored);
    await load();
  }

  function renderList() {
    return state.items
      .map(
        (item) => `
          <article class="media-item">
            <strong>${escapeHtml(item.status)}</strong>
            <span>${escapeHtml(item.createdAt)}</span>
            <small>${escapeHtml(item.publishAt ?? '')}</small>
            <div class="actions">
              ${canPreviewEntries() ? `<button type="button" class="ghost" data-version-compare-id="${escapeHtml(item.id)}">${escapeHtml(text('versionsCompare'))}</button>` : ''}
              ${canWriteEntries() ? `<button type="button" class="ghost" data-version-id="${escapeHtml(item.id)}">${escapeHtml(text('versionsRestore'))}</button>` : ''}
            </div>
          </article>
        `,
      )
      .join('');
  }

  function renderCompare() {
    if (!state.compareVersionId) {
      return '';
    }

    const current = getState();
    const version = state.items.find((item) => item.id === state.compareVersionId);

    if (!version) {
      return `<p class="version-compare-empty">${escapeHtml(text('versionsNoSelection'))}</p>`;
    }

    const diff = buildVersionComparison(current.fields ?? [], getBaseline(), version);
    const body = diff.length
      ? diff
          .map(
            (row) => `
              <article class="version-compare-row">
                <strong>${escapeHtml(row.key === 'status' ? text('versionsCompareStatus') : row.key === 'publishAt' ? text('versionsComparePublishAt') : row.label)}</strong>
                <div class="version-compare-values">
                  <div>
                    <span>${escapeHtml(text('versionsCompareCurrent'))}</span>
                    <strong>${escapeHtml(row.current)}</strong>
                  </div>
                  <div>
                    <span>${escapeHtml(text('versionsCompareVersion'))}</span>
                    <strong>${escapeHtml(row.version)}</strong>
                  </div>
                </div>
              </article>
            `,
          )
          .join('')
      : `<p class="version-compare-empty">${escapeHtml(text('versionsNoChanges'))}</p>`;

    return `
      <section class="version-compare">
        <div class="version-compare-head">
          <div>
            <h4>${escapeHtml(text('versionsCompareTitle'))}</h4>
            <p class="muted">${escapeHtml(text('versionsCompareHint'))}</p>
          </div>
          <button type="button" class="ghost" data-version-close-compare>${escapeHtml(text('versionsCloseCompare'))}</button>
        </div>
        <div class="version-compare-list">${body}</div>
      </section>
    `;
  }

  function setStatus(key, detail = '') {
    refs.status.textContent = text(key, detail);
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }
}
