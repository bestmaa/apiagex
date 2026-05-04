import { apiFetch } from './api.js';
import { translations } from './app-i18n.js';
import { getSession } from './session.js';

export function createBackupPanel() {
  const refs = { file: null, export: null, import: null, shell: null, status: null };

  init();
  return { clear, load: render };

  function init() {
    refs.shell = document.createElement('section');
    refs.shell.id = 'backup-shell';
    refs.shell.className = 'panel panel-wide hidden';
    refs.shell.dataset.routeSection = 'backups';
    refs.shell.innerHTML = `
      <div class="panel-head">
        <h2 data-i18n="backupsTitle">Backups</h2>
        <p data-i18n="backupsHint">Export or restore the current CMS state.</p>
      </div>
      <div class="actions backup-actions">
        <button id="backup-export" class="primary" type="button" data-i18n="backupsExport">Export backup</button>
        <input id="backup-file" type="file" accept="application/json" />
        <button id="backup-import" class="ghost" type="button" data-i18n="backupsRestore">Restore backup</button>
        <p id="backup-status" class="muted" aria-live="polite"></p>
      </div>
    `;
    document.querySelector('#webhooks-shell')?.insertAdjacentElement('beforebegin', refs.shell);
    refs.file = refs.shell.querySelector('#backup-file');
    refs.export = refs.shell.querySelector('#backup-export');
    refs.import = refs.shell.querySelector('#backup-import');
    refs.status = refs.shell.querySelector('#backup-status');
    refs.export.addEventListener('click', () => void exportBackup());
    refs.import.addEventListener('click', () => void restoreBackup());
    window.addEventListener('apiagex:language-changed', render);
    render();
  }

  function clear() {
    if (refs.file) {
      refs.file.value = '';
    }
    render();
  }

  async function exportBackup() {
    if (!canWrite()) {
      return;
    }

    setStatus('backupsExporting');
    const response = await apiFetch('/api/backups/export');
    if (!response.ok) {
      setStatus('backupsExportFailed');
      return;
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'apiagex-backup.json';
    anchor.click();
    URL.revokeObjectURL(url);
    setStatus('backupsExported');
  }

  async function restoreBackup() {
    if (!canWrite()) {
      return;
    }

    const file = refs.file.files?.[0];
    if (!file) {
      setStatus('backupsRestoreFailed');
      return;
    }

    setStatus('backupsRestoring');
    const payload = await file.text();
    const response = await apiFetch('/api/backups/restore', {
      body: payload,
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    });

    if (!response.ok) {
      setStatus('backupsRestoreFailed');
      return;
    }

    refs.file.value = '';
    setStatus('backupsRestored');
  }

  function render() {
    const visible = canWrite();
    refs.shell.classList.toggle('hidden', !visible);
    if (!visible) {
      setStatus('');
      return;
    }
  }

  function setStatus(key) {
    refs.status.textContent = key ? text(key) : '';
  }
}

function canWrite() {
  return getSession().role === 'admin';
}

function text(key) {
  const language = document.documentElement.lang === 'hi' ? 'hi' : 'en';
  return translations[language][key] ?? translations.en[key] ?? key;
}
