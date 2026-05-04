export const translations = {
  en: {
    clear: 'Clear',
    contentType: 'Content type',
    empty: 'Search content types, entries, and media.',
    entry: 'Entry',
    failed: 'Search failed.',
    loading: 'Searching...',
    media: 'Media',
    noResults: 'No results found.',
    open: 'Open',
    openMedia: 'Open file',
    results: 'Results',
    searchHint: 'Search across content types, entries, and media.',
    searchTitle: 'Global search',
    search: 'Search',
  },
  hi: {
    clear: 'Clear',
    contentType: 'Content type',
    empty: 'Content types, entries, aur media search karo.',
    entry: 'Entry',
    failed: 'Search failed.',
    loading: 'Searching...',
    media: 'Media',
    noResults: 'Koi result nahi mila.',
    open: 'Open',
    openMedia: 'File open karo',
    results: 'Results',
    searchHint: 'Content types, entries, aur media me search karo.',
    searchTitle: 'Global search',
    search: 'Search',
  },
};

export function text(key) {
  const language = document.documentElement.lang === 'hi' ? 'hi' : 'en';
  return translations[language][key] ?? translations.en[key] ?? key;
}
