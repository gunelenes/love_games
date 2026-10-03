// Adding a new language — recipe:
//   1. Copy `locales/en.json` to `locales/<xx>.json`, translate every value
//      (keep the keys and {{placeholders}} intact).
//   2. Import it here, add to the `resources` map, and add `'<xx>'` to
//      `SUPPORTED_LANGUAGES` below. Add a label to `settings.<xx>` in every
//      locale JSON so the Settings modal can show it.
//   3. For user-generated content (categories/places), the mobile picks
//      the right field in `utils/localizedContent.ts`. If the new language
//      is a European/Latin one, you can reuse the existing `pickLang()`
//      pattern by adding a `name<Xx>` / `prompts<Xx>` branch there and
//      exposing the matching optional fields on the types in `types/index.ts`
//      and `admin/lib/types.ts` (plus input fields in the admin editors).
//
// The default is English; Turkish is the fallback for untranslated keys.

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import tr from './locales/tr.json';

export const SUPPORTED_LANGUAGES = ['en', 'tr'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    tr: { translation: tr },
  },
  lng: DEFAULT_LANGUAGE,
  fallbackLng: 'tr',
  interpolation: { escapeValue: false },
  returnNull: false,
  compatibilityJSON: 'v4',
});

export default i18n;
