import { text } from './entries-i18n.js';

const STORAGE_KEY = 'apiagex.admin.entries.query';
const EVENT_NAME = 'apiagex:entries-query-changed';
const PAGE_SIZE_OPTIONS = [5, 10, 25];
const SORT_OPTIONS = ['newest', 'oldest'];
const DEFAULT_QUERY = {
  page: 1,
  pageSize: 10,
  search: '',
  sort: 'newest',
};

const refs = {
  next: document.getElementById('entry-page-next'),
  pageInfo: document.getElementById('entry-page-info'),
  pageSize: document.getElementById('entry-page-size'),
  prev: document.getElementById('entry-page-prev'),
  search: document.getElementById('entry-search'),
  sort: document.getElementById('entry-sort'),
  summary: document.getElementById('entry-summary'),
};

const state = normalizeQuery(readStoredQuery());

export function getEntriesQuery() {
  return { ...state };
}

export function buildEntriesRequestUrl(contentTypeId, statusFilter = '') {
  const query = getEntriesQuery();
  const params = new URLSearchParams();

  if (statusFilter === 'pendingApproval') {
    params.set('status', 'pendingApproval');
  }

  if (query.search) {
    params.set('q', query.search);
  }

  params.set('page', String(query.page));
  params.set('pageSize', String(query.pageSize));
  params.set('sort', query.sort);

  return `/api/content-types/${encodeURIComponent(contentTypeId)}/entries?${params.toString()}`;
}

export function initEntriesQuery() {
  if (!refs.search || !refs.pageSize || !refs.sort || !refs.prev || !refs.next) {
    return;
  }

  refs.search.value = state.search;
  refs.pageSize.value = String(state.pageSize);
  refs.sort.value = state.sort;

  refs.search.addEventListener('input', () => {
    setEntriesQuery({ page: 1, search: refs.search.value.trim() });
  });

  refs.pageSize.addEventListener('change', () => {
    setEntriesQuery({ page: 1, pageSize: Number(refs.pageSize.value) });
  });

  refs.sort.addEventListener('change', () => {
    setEntriesQuery({ page: 1, sort: refs.sort.value });
  });

  refs.prev.addEventListener('click', () => {
    setEntriesQuery({ page: Math.max(1, state.page - 1) });
  });

  refs.next.addEventListener('click', () => {
    setEntriesQuery({ page: state.page + 1 });
  });

  renderQueryMeta({
    pendingApproval: 0,
    page: state.page,
    pageSize: state.pageSize,
    pages: 0,
    total: 0,
  });
}

export function setEntriesQuery(next) {
  const nextState = normalizeQuery({ ...state, ...next });

  if (isSameQuery(state, nextState)) {
    return;
  }

  state.page = nextState.page;
  state.pageSize = nextState.pageSize;
  state.search = nextState.search;
  state.sort = nextState.sort;
  persistQuery(state);
  syncControls();
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { query: getEntriesQuery() } }));
}

export function renderQueryMeta(meta) {
  if (refs.summary) {
    const pending = Number(meta?.pendingApproval ?? 0);
    const total = Number(meta?.total ?? 0);
    const page = Number(meta?.page ?? state.page);
    const pages = Number(meta?.pages ?? 0);

    const pieces = [text('entriesPendingCount', String(pending)), text('entriesTotalCount', String(total))];
    if (pages > 0) {
      pieces.push(text('entriesPageLabel', `${page} of ${pages}`));
    }

    refs.summary.textContent = pieces.join(' · ');
  }

  if (refs.pageInfo) {
    const page = Number(meta?.page ?? state.page);
    const pages = Number(meta?.pages ?? 0);
    const total = Number(meta?.total ?? 0);
    refs.pageInfo.textContent = pages > 0
      ? `${text('entriesPageInfo', `${page} of ${pages}`)} (${text('entriesTotalCount', String(total))})`
      : total > 0
        ? text('entriesTotalCount', String(total))
        : '';
  }

  if (refs.prev) {
    refs.prev.disabled = Number(meta?.page ?? state.page) <= 1;
  }

  if (refs.next) {
    const page = Number(meta?.page ?? state.page);
    const pages = Number(meta?.pages ?? 0);
    refs.next.disabled = pages <= 0 || page >= pages;
  }
}

function normalizeQuery(query) {
  const pageSize = PAGE_SIZE_OPTIONS.includes(Number(query?.pageSize)) ? Number(query.pageSize) : DEFAULT_QUERY.pageSize;
  const sort = SORT_OPTIONS.includes(String(query?.sort)) ? String(query.sort) : DEFAULT_QUERY.sort;
  const search = typeof query?.search === 'string' ? query.search.trim().slice(0, 120) : DEFAULT_QUERY.search;
  const page = Number.isFinite(Number(query?.page)) ? Math.max(1, Math.floor(Number(query.page))) : DEFAULT_QUERY.page;

  return {
    page,
    pageSize,
    search,
    sort,
  };
}

function readStoredQuery() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_QUERY;
  } catch {
    return DEFAULT_QUERY;
  }
}

function persistQuery(query) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(query));
}

function syncControls() {
  if (refs.search) {
    refs.search.value = state.search;
  }

  if (refs.pageSize) {
    refs.pageSize.value = String(state.pageSize);
  }

  if (refs.sort) {
    refs.sort.value = state.sort;
  }
}

function isSameQuery(left, right) {
  return left.page === right.page
    && left.pageSize === right.pageSize
    && left.search === right.search
    && left.sort === right.sort;
}
