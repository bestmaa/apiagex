import { text } from './search-i18n.js';

const STYLE_ID = 'apiagex-search-styles';

export function createGlobalSearchPanel(apiFetch) {
  const state = {
    items: [],
    loaded: false,
    query: '',
    status: 'idle',
  };

  const refs = {
    clear: null,
    form: null,
    query: null,
    results: null,
    shell: null,
    status: null,
  };

  init();

  return {
    clear,
    render,
  };

  function init() {
    injectStylesheet();
    refs.shell = document.createElement('section');
    refs.shell.id = 'search-shell';
    refs.shell.className = 'panel panel-wide search-shell';
    refs.shell.dataset.routeSection = 'dashboard';
    refs.shell.innerHTML = `
      <div class="panel-head">
        <h2>${escapeHtml(text('searchTitle'))}</h2>
        <p>${escapeHtml(text('searchHint'))}</p>
      </div>
      <form id="search-form" class="search-form">
        <input id="search-query" type="search" placeholder="${escapeHtml(text('search'))}" />
        <button class="primary" type="submit">${escapeHtml(text('search'))}</button>
        <button id="search-clear" class="ghost" type="button">${escapeHtml(text('clear'))}</button>
      </form>
      <p id="search-status" class="muted" aria-live="polite"></p>
      <div id="search-results" class="search-results"></div>
    `;

    const layout = document.querySelector('#app-shell .layout');
    layout?.parentElement?.insertBefore(refs.shell, layout);
    refs.form = refs.shell.querySelector('#search-form');
    refs.query = refs.shell.querySelector('#search-query');
    refs.clear = refs.shell.querySelector('#search-clear');
    refs.results = refs.shell.querySelector('#search-results');
    refs.status = refs.shell.querySelector('#search-status');

    refs.form?.addEventListener('submit', submitSearch);
    refs.clear?.addEventListener('click', clear);
    refs.results?.addEventListener('click', handleResultClick);
    window.addEventListener('apiagex:language-changed', render);
    render();
  }

  function clear() {
    state.items = [];
    state.loaded = false;
    state.query = '';
    state.status = 'idle';
    if (refs.query) {
      refs.query.value = '';
    }
    render();
  }

  async function submitSearch(event) {
    event.preventDefault();

    const query = refs.query?.value.trim() ?? '';
    state.query = query;

    if (!query) {
      clear();
      return;
    }

    state.loaded = false;
    state.status = 'loading';
    render();

    const response = await apiFetch(`/api/search?q=${encodeURIComponent(query)}`);

    if (!response.ok) {
      state.status = 'failed';
      state.items = [];
      state.loaded = true;
      render();
      return;
    }

    const data = await response.json();
    state.items = Array.isArray(data.items) ? data.items : [];
    state.loaded = true;
    state.status = 'ready';
    render();
  }

  function handleResultClick(event) {
    const button = event.target.closest('[data-search-action]');

    if (!button) {
      return;
    }

    const kind = button.dataset.searchKind ?? '';

    if (kind === 'media') {
      return;
    }

    const contentTypeId = button.dataset.searchContentTypeId ?? '';
    const contentTypeName = button.dataset.searchContentTypeName ?? contentTypeId;
    const entryId = button.dataset.searchEntryId ?? '';

    if (!contentTypeId) {
      return;
    }

    window.dispatchEvent(
      new CustomEvent('apiagex:content-type-selected', {
        detail: { displayName: contentTypeName, id: contentTypeId },
      }),
    );

    if (kind === 'entry' && entryId) {
      window.dispatchEvent(
        new CustomEvent('apiagex:content-entry-selected', {
          detail: { contentTypeId, contentTypeName, entryId },
        }),
      );
      document.getElementById('entry-form')?.scrollIntoView({ block: 'start', behavior: 'smooth' });
      return;
    }

    document.getElementById('content-form')?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }

  function render() {
    if (!refs.shell) {
      return;
    }

    if (refs.query && refs.query.value !== state.query) {
      refs.query.value = state.query;
    }

    if (state.status === 'loading') {
      refs.status.textContent = text('loading');
    } else if (state.status === 'failed') {
      refs.status.textContent = text('failed');
    } else if (!state.query) {
      refs.status.textContent = text('empty');
    } else {
      refs.status.textContent = `${text('results')}: ${state.items.length}`;
    }

    refs.results.innerHTML = renderResults();
    refs.clear.disabled = !state.query && !state.items.length;
  }

  function renderResults() {
    if (!state.query) {
      return '';
    }

    if (state.status === 'loading' || !state.loaded) {
      return `<p class="muted">${escapeHtml(text('loading'))}</p>`;
    }

    if (!state.items.length) {
      return `<p class="muted">${escapeHtml(text('noResults'))}</p>`;
    }

    return state.items.map(renderItem).join('');
  }

  function renderItem(item) {
    const kindLabel =
      item.kind === 'content-type' ? text('contentType') : item.kind === 'entry' ? text('entry') : text('media');
    const action =
      item.kind === 'media'
        ? `<a class="ghost button-link" href="${escapeHtml(item.mediaUrl ?? '#')}" target="_blank" rel="noreferrer">${escapeHtml(text('openMedia'))}</a>`
        : `<button class="ghost" type="button" data-search-action="open" data-search-kind="${escapeHtml(item.kind)}" data-search-content-type-id="${escapeHtml(item.contentTypeId ?? '')}" data-search-content-type-name="${escapeHtml(item.kind === 'content-type' ? item.title : item.subtitle)}" data-search-entry-id="${escapeHtml(item.entryId ?? '')}">${escapeHtml(text('open'))}</button>`;

    return `
      <article class="search-result">
        <div class="search-result-head">
          <strong>${escapeHtml(item.title)}</strong>
          <span class="badge">${escapeHtml(kindLabel)}</span>
        </div>
        <p class="muted">${escapeHtml(item.subtitle)}</p>
        <p>${escapeHtml(item.detail)}</p>
        <div class="actions">${action}</div>
      </article>
    `;
  }
}

function injectStylesheet() {
  if (document.getElementById(STYLE_ID)) {
    return;
  }

  const link = document.createElement('link');
  link.id = STYLE_ID;
  link.rel = 'stylesheet';
  link.href = '/search.css';
  document.head.appendChild(link);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
