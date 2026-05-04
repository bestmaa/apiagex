import { text } from './entries-i18n.js';
import { getSession } from './session.js';

export function createEntryApprovalPanel(apiFetch, getState, onChange) {
  const refs = {
    shell: document.getElementById('entry-approval'),
  };

  const state = {
    busy: '',
    message: '',
  };

  init();

  return {
    clear,
    render,
  };

  function init() {
    window.addEventListener('apiagex:language-changed', render);
    render();
  }

  function clear() {
    state.busy = '';
    state.message = '';
    render();
  }

  function render() {
    const current = getState();
    const currentEntry = current.items.find((item) => item.id === current.editingId);
    const visible = getSession().role === 'admin' && Boolean(currentEntry && currentEntry.status === 'pendingApproval');

    refs.shell.classList.toggle('hidden', !visible);

    if (!visible) {
      refs.shell.innerHTML = '';
      return;
    }

    refs.shell.innerHTML = `
      <section class="version-compare">
        <div class="version-compare-head">
          <div>
            <h4>${escapeHtml(text('approvalTitle'))}</h4>
            <p class="muted">${escapeHtml(text('approvalHint'))}</p>
          </div>
          <strong>${escapeHtml(text('approvalWaiting'))}</strong>
        </div>
        <div class="version-compare-list">
          <article class="version-compare-row">
            <strong>${escapeHtml(currentEntry?.id ?? '')}</strong>
            <div class="version-compare-values">
              <div>
                <span>${escapeHtml(text('approvalCurrent'))}</span>
                <strong>${escapeHtml(currentEntry?.status ?? '')}</strong>
              </div>
              <div class="actions">
                <button type="button" class="primary" data-approval-action="approve" ${state.busy === 'approve' ? 'disabled' : ''}>${escapeHtml(text('approvalApprove'))}</button>
                <button type="button" class="ghost" data-approval-action="reject" ${state.busy === 'reject' ? 'disabled' : ''}>${escapeHtml(text('approvalReject'))}</button>
              </div>
            </div>
          </article>
        </div>
        <p class="muted" aria-live="polite">${escapeHtml(state.message || text('approvalIdle'))}</p>
      </section>
    `;

    refs.shell.querySelectorAll('[data-approval-action]').forEach((button) => {
      button.addEventListener('click', () => {
        const action = button.dataset.approvalAction;

        if (action !== 'approve' && action !== 'reject') {
          return;
        }

        void transition(action);
      });
    });
  }

  async function transition(action) {
    const current = getState();
    const entryId = current.editingId;

    if (!current.contentTypeId || !entryId) {
      return;
    }

    state.busy = action;
    state.message = action === 'approve' ? text('approvalProcessingApprove') : text('approvalProcessingReject');
    render();

    const response = await apiFetch(
      `/api/content-types/${encodeURIComponent(current.contentTypeId)}/entries/${encodeURIComponent(entryId)}/${action}`,
      { method: 'POST' },
    );

    state.busy = '';

    if (!response.ok) {
      state.message = text('approvalFailed');
      render();
      return;
    }

    const updated = await response.json().catch(() => null);
    state.message = action === 'approve' ? text('approvalApplied') : text('approvalRejected');
    render();
    await onChange?.(updated);
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
