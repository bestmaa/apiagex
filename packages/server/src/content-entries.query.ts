import type { ContentEntryRecord } from './content-entries.routes.type.js';

export interface ContentEntriesListQuery {
  page?: string | number | undefined;
  pageSize?: string | number | undefined;
  q?: string | undefined;
  sort?: string | undefined;
  status?: string | undefined;
}

export interface ContentEntriesListView {
  counts: {
    pendingApproval: number;
    total: number;
  };
  items: readonly ContentEntryRecord[];
  page: number;
  pageSize: number;
  pages: number;
  total: number;
}

export function buildContentEntriesListView(
  items: readonly ContentEntryRecord[],
  query: ContentEntriesListQuery,
): ContentEntriesListView {
  const filtered = filterEntries(items, query);
  const pageSize = clampNumber(query.pageSize, 10, 1, 50);
  const total = filtered.length;
  const pages = total > 0 ? Math.ceil(total / pageSize) : 0;
  const page = pages > 0 ? clampNumber(query.page, 1, 1, pages) : 1;
  const start = pages > 0 ? (page - 1) * pageSize : 0;
  const paged = pages > 0 ? filtered.slice(start, start + pageSize) : [];

  return {
    counts: {
      pendingApproval: filtered.filter((item) => item.status === 'pendingApproval').length,
      total,
    },
    items: paged,
    page,
    pageSize,
    pages,
    total,
  };
}

function filterEntries(items: readonly ContentEntryRecord[], query: ContentEntriesListQuery): readonly ContentEntryRecord[] {
  const search = normalizeSearch(query.q);
  const sorted = query.sort === 'oldest' ? [...items].reverse() : [...items];

  return sorted.filter((item) => {
    if (query.status === 'pendingApproval' && item.status !== 'pendingApproval') {
      return false;
    }

    if (!search) {
      return true;
    }

    return [
      item.id,
      item.status,
      item.publishAt ?? '',
      JSON.stringify(item.data),
    ].some((value) => value.toLowerCase().includes(search));
  });
}

function clampNumber(value: string | number | undefined, fallback: number, min: number, max: number): number {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.floor(parsed)));
}

function normalizeSearch(value: string | undefined): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}
