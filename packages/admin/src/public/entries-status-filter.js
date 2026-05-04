const STORAGE_KEY = 'apiagex.admin.entries.status-filter';
const EVENT_NAME = 'apiagex:entries-status-filter-changed';

export function getEntriesStatusFilter() {
  const value = window.localStorage.getItem(STORAGE_KEY);

  return value === 'pendingApproval' ? 'pendingApproval' : 'all';
}

export function setEntriesStatusFilter(value) {
  window.localStorage.setItem(STORAGE_KEY, value === 'pendingApproval' ? 'pendingApproval' : 'all');
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { value: getEntriesStatusFilter() } }));
}

export function initEntriesStatusFilter() {
  document.querySelectorAll('[data-entry-status-filter]').forEach((button) => {
    button.addEventListener('click', () => {
      const value = button.dataset.entryStatusFilter ?? 'all';
      setEntriesStatusFilter(value);
      renderEntriesStatusFilter();
    });
  });

  window.addEventListener('apiagex:language-changed', renderEntriesStatusFilter);
  renderEntriesStatusFilter();
}

export function renderEntriesStatusFilter() {
  const current = getEntriesStatusFilter();

  document.querySelectorAll('[data-entry-status-filter]').forEach((button) => {
    button.classList.toggle('active', (button.dataset.entryStatusFilter ?? 'all') === current);
  });
}
