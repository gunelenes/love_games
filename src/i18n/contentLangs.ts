/**
 * Supported CONTENT languages — locale codes that admin editors offer and
 * that `localizedContent.ts` tries to resolve. Separate from the UI shell
 * locale list in `i18n/index.ts` because UI translations are mandatory for
 * each supported app language, while CONTENT translations are optional
 * (fall back to Turkish). Order here is just the admin dropdown order.
 *
 * Chinese is `zh-TW` (Traditional, Taiwan + diaspora) rather than `zh-CN`
 * — mainland app stores block sensual content, so there is no path to
 * ship a Simplified variant without a separate censored build.
 */
export const CONTENT_LANGS = [
  'en',
  'es',
  'de',
  'fr',
  'it',
  'pt',
  'ja',
  'ko',
  'zh-TW',
  'id',
  'hi',
  'ar',
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
  ko: '한국어',
  'zh-TW': '繁體中文',
  id: 'Bahasa Indonesia',
  hi: 'हिन्दी',
  ar: 'العربية',
};
