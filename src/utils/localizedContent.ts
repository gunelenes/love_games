import i18n from '@/i18n';
import type { Category, Place, PlaceCategory } from '@/types';

/**
 * Content localization lives next to each item: the Turkish default is in
 * `name`/`prompts`, English translations are in optional `nameEn`/`promptsEn`.
 * When a translation is missing, we fall back to Turkish rather than show
 * a key — users prefer a familiar sentence over an empty one.
 *
 * To add another language later: add `name<Xx>` / `prompts<Xx>` fields to
 * the item (and the type), then teach `pickLang()` which locale maps to it.
 */

function pickLang(): 'en' | 'tr' {
  const lang = (i18n.language || i18n.resolvedLanguage || 'en').toLowerCase();
  if (lang.startsWith('tr')) return 'tr';
  return 'en';
}

function pickString(tr: string, en: string | undefined): string {
  const lang = pickLang();
  if (lang === 'en' && en && en.trim()) return en;
  return tr;
}

function pickOptional(
  tr: string | undefined,
  en: string | undefined
): string | undefined {
  const lang = pickLang();
  if (lang === 'en' && en && en.trim()) return en;
  return tr;
}

function pickPrompts(tr: string[], en: string[] | undefined): string[] {
  const lang = pickLang();
  if (lang !== 'en' || !Array.isArray(en) || en.length === 0) return tr;
  return tr.map((trPrompt, i) => {
    const enPrompt = en[i];
    return enPrompt && enPrompt.trim() ? enPrompt : trPrompt;
  });
}

export function localizeCategory(cat: Category): Category {
  return {
    ...cat,
    name: pickString(cat.name, cat.nameEn),
    prompts: pickPrompts(cat.prompts, cat.promptsEn),
  };
}

export function localizePlace(place: Place): Place {
  return {
    ...place,
    name: pickString(place.name, place.nameEn),
    description: pickOptional(place.description, place.descriptionEn),
  };
}

export function localizePlaceCategory(pc: PlaceCategory): PlaceCategory {
  return {
    ...pc,
    name: pickString(pc.name, pc.nameEn),
    places: pc.places.map(localizePlace),
  };
}
