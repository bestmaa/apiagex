import {
  extractLocalizedSection,
  getDocumentTitle,
  renderMarkdown,
} from './markdown.js';
import { buildDynamicApiMarkdownSections } from './dynamic-api.js';

const pages = [
  { label: { en: 'Overview', hi: 'Overview' }, path: 'README.md', summary: { en: 'Markdown index and current scope.', hi: 'Markdown index aur current scope.' } },
  { label: { en: 'Install', hi: 'Install' }, path: 'install.md', summary: { en: 'How the installer works.', hi: 'Installer ka flow.' } },
  { label: { en: 'Local DB', hi: 'Local DB' }, path: 'local-database.md', summary: { en: 'SQLite local development mode.', hi: 'SQLite local development mode.' } },
  { label: { en: 'Admin UI', hi: 'Admin UI' }, path: 'admin-ui.md', summary: { en: 'Login, roles, and content editing.', hi: 'Login, roles, aur content editing.' } },
  { label: { en: 'Roles', hi: 'Roles' }, path: 'roles.md', summary: { en: 'Role catalog management.', hi: 'Role catalog management.' } },
  { label: { en: 'Security', hi: 'Security' }, path: 'security.md', summary: { en: 'Authentication and permissions.', hi: 'Authentication aur permissions.' } },
  { label: { en: 'Audit', hi: 'Audit' }, path: 'audit.md', summary: { en: 'Mutation tracking.', hi: 'Mutation tracking.' } },
  { label: { en: 'Webhooks', hi: 'Webhooks' }, path: 'webhooks.md', summary: { en: 'Outbound event delivery.', hi: 'Outbound event delivery.' } },
  { label: { en: 'Realtime', hi: 'Realtime' }, path: 'realtime.md', summary: { en: 'Opt-in live updates.', hi: 'Opt-in live updates.' } },
  { label: { en: 'Public API', hi: 'Public API' }, path: 'public-api.md', summary: { en: 'Read routes and populate support.', hi: 'Read routes aur populate support.' } },
  { label: { en: 'Dynamic API', hi: 'Dynamic API' }, path: 'dynamic-api.md', summary: { en: 'Auto-generated docs for content types.', hi: 'Content types ke liye auto-generated docs.' } },
  { label: { en: 'Verification', hi: 'Verification' }, path: 'manual-verification.md', summary: { en: 'Repeatable manual browser checks.', hi: 'Repeatable manual browser checks.' } },
  { label: { en: 'Production', hi: 'Production' }, path: 'production.md', summary: { en: 'Hardening checks for deployment.', hi: 'Deployment ke liye hardening checks.' } },
  { label: { en: 'Search', hi: 'Search' }, path: 'search.md', summary: { en: 'Global search across admin data.', hi: 'Admin data par global search.' } },
  { label: { en: 'Performance', hi: 'Performance' }, path: 'performance.md', summary: { en: 'Hot-path indexes and benchmark notes.', hi: 'Hot-path indexes aur benchmark notes.' } },
  { label: { en: 'Backup', hi: 'Backup' }, path: 'backup.md', summary: { en: 'Export and restore CMS state.', hi: 'CMS state export aur restore.' } },
  { label: { en: 'Migrations', hi: 'Migrations' }, path: 'migrations.md', summary: { en: 'Schema version history.', hi: 'Schema version history.' } },
  { label: { en: 'Release', hi: 'Release' }, path: 'release.md', summary: { en: 'Smoke checks and release gates.', hi: 'Smoke checks aur release gates.' } },
];

const state = {
  currentPath: localStorage.getItem('apiagex-docs-page') || 'README.md',
  language: localStorage.getItem('apiagex-docs-language') || 'en',
};

const staticText = {
  en: {
    docsHeroLabel: 'Live markdown docs',
    docsIndexLabel: 'Markdown source of truth',
  },
  hi: {
    docsHeroLabel: 'Markdown docs live',
    docsIndexLabel: 'Markdown hi source hai',
  },
};

const cache = new Map();

const refs = {
  content: document.getElementById('doc-content'),
  nav: document.getElementById('docs-nav'),
  summary: document.getElementById('doc-summary'),
  title: document.getElementById('doc-title'),
};

init();

function init() {
  renderLanguageControls();
  renderNav();
  attachLanguageHandlers();
  selectPage(state.currentPath);
}

function attachLanguageHandlers() {
  document.querySelectorAll('[data-language]').forEach((button) => {
    button.addEventListener('click', () => setLanguage(button.dataset.language));
  });
}

function renderLanguageControls() {
  document.documentElement.lang = state.language;
  document.querySelectorAll('[data-language]').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.language === state.language);
  });
  document.querySelectorAll('[data-i18n]').forEach((node) => {
    const key = node.dataset.i18n;
    node.textContent = staticText[state.language][key] || node.textContent;
  });
}

function renderNav() {
  refs.nav.innerHTML = '';

  pages.forEach((page) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `nav-item${page.path === state.currentPath ? ' active' : ''}`;
    button.dataset.path = page.path;
    button.textContent = page.label[state.language] || page.label.en;
    button.addEventListener('click', () => selectPage(page.path));
    refs.nav.appendChild(button);
  });
}

function setLanguage(language) {
  state.language = language === 'hi' ? 'hi' : 'en';
  localStorage.setItem('apiagex-docs-language', state.language);
  renderLanguageControls();
  renderNav();
  selectPage(state.currentPath);
}

async function selectPage(path) {
  state.currentPath = path;
  localStorage.setItem('apiagex-docs-page', path);
  renderNav();
  refs.title.textContent = 'Loading...';
  refs.summary.textContent = '';
  refs.content.innerHTML = '<p>Loading markdown...</p>';

  const page = pages.find((item) => item.path === path) || pages[0];
  const markdown = await loadMarkdown(page.path);
  const localized = extractLocalizedSection(markdown, state.language);

  refs.title.textContent = getDocumentTitle(markdown, page.label.en);
  refs.summary.textContent = page.summary[state.language] || page.summary.en;
  refs.content.innerHTML = renderMarkdown(localized);
}

async function loadMarkdown(path) {
  if (path === 'dynamic-api.md') {
    const [templateResponse, contentTypesResponse] = await Promise.all([
      fetch(`./${path}`),
      fetch('/api/docs/content-types'),
    ]);
    const template = await templateResponse.text();
    const contentTypesData = await contentTypesResponse.json();
    const sections = buildDynamicApiMarkdownSections(Array.isArray(contentTypesData.items) ? contentTypesData.items : []);

    return template
      .replace('{{DYNAMIC_API_DOCS_EN}}', sections.en)
      .replace('{{DYNAMIC_API_DOCS_HI}}', sections.hi);
  }

  if (cache.has(path)) {
    return cache.get(path);
  }

  const response = await fetch(`./${path}`);
  const markdown = await response.text();
  cache.set(path, markdown);

  return markdown;
}
