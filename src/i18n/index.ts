// Adding a new language — recipe:
//
//   UI shell (strings baked into the app):
//     1. Copy `locales/en.json` → `locales/<xx>.json`, translate every value
//        (keep the keys and {{placeholders}} intact).
//     2. Import it here, add to the `resources` map, and add `'<xx>'` to
//        `SUPPORTED_LANGUAGES` below. Add a label to `settings.<xx>` in
//        every locale JSON so the Settings modal can show it.
//
//   Dynamic content (categories / prompts / places from Firestore):
//     3. Add the locale code + display label to `src/i18n/contentLangs.ts`
//        AND `admin/lib/contentLangs.ts` (keep the two mirrors in sync).
//        The admin dropdown surfaces it immediately — no editor changes
//        needed. Mobile's resolver (`utils/localizedContent.ts`) picks the
//        new key out of the per-item translation maps the moment admins
//        start filling it in; untranslated items fall back to English
//        and then to the Turkish authoring default.
//
// The UI default is English; Turkish is the UI fallback for untranslated
// keys. For CONTENT, Turkish is the authoring default and English is the
// secondary fallback.

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import de from './locales/de.json';
import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import it from './locales/it.json';
import tr from './locales/tr.json';

export const SUPPORTED_LANGUAGES = ['en', 'tr', 'de', 'fr', 'es', 'it'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    tr: { translation: tr },
    de: { translation: de },
    fr: { translation: fr },
    es: { translation: es },
    it: { translation: it },
  },
  lng: DEFAULT_LANGUAGE,
  // English is the authoring language for the UI shell; missing keys in any
  // non-en locale fall back to en (not tr) so a half-translated locale
  // never surprises a user with a Turkish word in the middle of their UI.
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnNull: false,
  compatibilityJSON: 'v4',
});

export default i18n;
