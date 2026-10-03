/**
 * Supported CONTENT languages — locale codes that admin editors offer and
 * that `localizedContent.ts` tries to resolve. Separate from the UI shell
 * locale list in `i18n/index.ts` because UI translations are mandatory for
 * each supported app language, while CONTENT translations are optional
 * (fall back to Turkish). Order here is just the admin dropdown order.
 */
export const CONTENT_LANGS = [
  'en',
  'es',
  'de',
  'fr',
  'it',
  'pt',
  'ja',
  'zh',
] as const;

export type ContentLang = (typeof CONTENT_LANGS)[number];

/** Authoring default — the plain `name` / `prompts` fields are in this language. */
export const CONTENT_DEFAULT_LANG = 'tr';

export const CONTENT_LANG_LABEL: Record<ContentLang | 'tr', string> = {
  tr: 'Türkçe (default)',
  en: 'English',
  es: 'Español',
  de: 'Deutsch',
  fr: 'Français',
  it: 'Italiano',
  pt: 'Português',
  ja: '日本語',
  zh: '中文',
};
