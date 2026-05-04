export const translations = {
  en: {
    empty: 'No media files yet.',
    hint: 'Upload a file to make it available to media fields.',
    label: 'Media library',
    mimeType: 'MIME type',
    name: 'File name',
    refresh: 'Refresh',
    upload: 'Upload',
    uploadFailed: 'Upload failed.',
    uploading: 'Uploading...',
  },
  hi: {
    empty: 'Abhi koi media file nahi hai.',
    hint: 'File upload karo taaki media fields me use ho sake.',
    label: 'Media library',
    mimeType: 'MIME type',
    name: 'File name',
    refresh: 'Refresh',
    upload: 'Upload',
    uploadFailed: 'Upload failed.',
    uploading: 'Uploading...',
  },
};

export function text(key) {
  const language = document.documentElement.lang === 'hi' ? 'hi' : 'en';
  return translations[language][key] ?? translations.en[key] ?? key;
}
