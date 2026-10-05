import i18n from '@/i18n';
import { CONTENT_DEFAULT_LANG } from '@/i18n/contentLangs';
import type {
  Category,
  LocalizedString,
  LocalizedStringArray,
  Place,
  PlaceCategory,
  Pose,
} from '@/types';

/**
 * Content lives next to each item as:
 *   name:    string                    // authoring default (tr)
 *   nameI18n?: Record<locale, string>  // other languages
 *
 * Resolution (`pickString`):
 *   1. If current UI locale IS the authoring default → the raw `name`.
 *   2. Else look up `nameI18n[current]` (exact), then the base code
 *      (e.g. `en-US` → `en`), then `en` as a universal secondary
 *      fallback (translators usually ship EN first).
 *   3. If nothing matches → the raw `name` (user sees Turkish instead
 *      of an empty cell — never a key).
 *
 * Adding the N+1-th language is purely a data change: write a new key
 * into the map from the admin panel. The schema does not move.
 */

function currentLang(): string {
  const raw = i18n.language || i18n.resolvedLanguage || 'en';
  return raw.toLowerCase();
}

function baseLang(lang: string): string {
  const i = lang.indexOf('-');
  return i === -1 ? lang : lang.slice(0, i);
}

function pickString(fallback: string, map: LocalizedString | undefined): string {
  const cur = currentLang();
  const base = baseLang(cur);
  if (base === CONTENT_DEFAULT_LANG) return fallback;
  if (!map) return fallback;
  const exact = map[cur]?.trim();
  if (exact) return exact;
  const b = map[base]?.trim();
  if (b) return b;
  const en = map.en?.trim();
  if (en) return en;
  return fallback;
}

function pickOptionalString(
  fallback: string | undefined,
  map: LocalizedString | undefined
): string | undefined {
  if (fallback === undefined && !map) return undefined;
  const cur = currentLang();
  const base = baseLang(cur);
  if (base === CONTENT_DEFAULT_LANG) return fallback;
  if (map) {
    const exact = map[cur]?.trim();
    if (exact) return exact;
    const b = map[base]?.trim();
    if (b) return b;
    const en = map.en?.trim();
    if (en) return en;
  }
  return fallback;
}

function pickArrayByLang(
  map: LocalizedStringArray | undefined
): string[] | undefined {
  if (!map) return undefined;
  const cur = currentLang();
  const base = baseLang(cur);
  return map[cur] || map[base] || map.en;
}

function pickPrompts(
  fallback: string[],
  map: LocalizedStringArray | undefined
): string[] {
  const base = baseLang(currentLang());
  if (base === CONTENT_DEFAULT_LANG) return fallback;
  const chosen = pickArrayByLang(map);
  if (!chosen) return fallback;
  // Element-wise fallback keeps partially-translated categories usable.
  return fallback.map((trPrompt, i) => {
    const translated = chosen[i];
    return translated && translated.trim() ? translated : trPrompt;
  });
}

export function localizeCategory(cat: Category): Category {
  return {
    ...cat,
    name: pickString(cat.name, cat.nameI18n),
    prompts: pickPrompts(cat.prompts, cat.promptsI18n),
  };
}

export function localizePlace(place: Place): Place {
  return {
    ...place,
    name: pickString(place.name, place.nameI18n),
    description: pickOptionalString(place.description, place.descriptionI18n),
  };
}

export function localizePlaceCategory(pc: PlaceCategory): PlaceCategory {
  return {
    ...pc,
    name: pickString(pc.name, pc.nameI18n),
    places: pc.places.map(localizePlace),
  };
}

export function localizePose(pose: Pose): Pose {
  return {
    ...pose,
    name: pickString(pose.name, pose.nameI18n),
    description: pickOptionalString(pose.description, pose.descriptionI18n),
  };
}
