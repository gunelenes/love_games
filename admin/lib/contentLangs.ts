// Mirror of src/i18n/contentLangs.ts in the mobile app. Keep them in sync.
// Adding the N+1-th language = add its code + label here and the admin
// dropdown surfaces it instantly.

export const CONTENT_LANGS = [
  'en',
  'es',
  'de',
  'fr',
  'it',
  'pt',
  'ru',
  'ja',
  'zh',
  'ar',
] as const;

export type ContentLang = (typeof CONTENT_LANGS)[number];

export const CONTENT_DEFAULT_LANG = 'tr';

export const CONTENT_LANG_LABEL: Record<ContentLang | 'tr', string> = {
  tr: 'Türkçe (default)',
  en: 'English',
  es: 'Español',
  de: 'Deutsch',
  fr: 'Français',
  it: 'Italiano',
  pt: 'Português',
  ru: 'Русский',
  ja: '日本語',
  zh: '中文',
  ar: 'العربية',
};
