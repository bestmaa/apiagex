export const translations = {
  en: {
    action: 'Action',
    actor: 'Actor',
    empty: 'No audit logs yet.',
    forbidden: 'Audit logs are available to admin accounts only.',
    itemCount: (count) => `${count} item(s)`,
    loadFailed: 'Load failed.',
    loading: 'Loading...',
    scope: 'Scope',
    subject: 'Subject',
    time: 'Time',
    details: 'Details',
  },
  hi: {
    action: 'Action',
    actor: 'Actor',
    empty: 'Abhi koi audit log nahi hai.',
    forbidden: 'Audit logs sirf admin accounts ke liye available hain.',
    itemCount: (count) => `${count} item(s)`,
    loadFailed: 'Load failed.',
    loading: 'Loading...',
    scope: 'Scope',
    subject: 'Subject',
    time: 'Time',
    details: 'Details',
  },
};

export function text(key, detail = '') {
  const language = document.documentElement.lang === 'hi' ? 'hi' : 'en';
  const dictionary = translations[language] ?? translations.en;
  const value = dictionary[key] ?? translations.en[key] ?? key;

  return typeof value === 'function' ? value(detail) : value;
}
