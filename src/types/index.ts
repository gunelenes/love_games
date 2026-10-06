export type Track = 'romantik' | 'cesur';
export type Level = 1 | 2 | 3 | 4 | 5;
export type KinkFlavor =
  | 'rope'
  | 'command'
  | 'petplay'
  | 'primal'
  | 'sensory'
  | 'roleplay'
  | 'impact';

/**
 * Content translation maps. Keyed by locale code (e.g. 'en', 'es', 'de').
 * Any locale key may be missing; the resolver in utils/localizedContent.ts
 * falls back through `en` and finally the Turkish `name` / `prompts`.
 *
 * Design choice: Turkish is the authoring default (lives on `name` /
 * `prompts` for back-compat with existing Firestore docs). Every other
 * language is a key on `nameI18n` / `promptsI18n` — adding the 11th
 * language later is a data change, not a schema change.
 */
export type LocalizedString = Record<string, string>;
export type LocalizedStringArray = Record<string, string[]>;

export type Category = {
  id: string;
  /** Default (tr) name — authoring source, always present. */
  name: string;
  color: string;
  icon: string;
  prompts: string[];
  /** Translations of `name`, keyed by locale code. */
  nameI18n?: LocalizedString;
  /**
   * Translations of `prompts`, keyed by locale code. Each array aligns
   * by index with `prompts`; empty strings fall back to tr at that slot.
   */
  promptsI18n?: LocalizedStringArray;
  /** İçeriğin ait olduğu track — bundle default'u romantik. */
  track: Track;
  /** 1-5 arası intimacy seviyesi — bundle default'u 1. */
  level: Level;
  /** L3+ için opsiyonel BDSM/kink flavor etiketleri. */
  flavors?: KinkFlavor[];
};

export type Place = {
  name: string;
  description?: string;
  image?: string;
  nameI18n?: LocalizedString;
  descriptionI18n?: LocalizedString;
};

export type PlaceCategory = {
  id: string;
  name: string;
  color: string;
  icon: string;
  places: Place[];
  nameI18n?: LocalizedString;
  track: Track;
  level: Level;
};

/**
 * Kama Sutra-style pose card. White charcoal-art background on dark app.
 * Localized name/description so the pose UI works in all 10 locales.
 */
export type Pose = {
  id: string;
  name: string;
  description?: string;
  image: number;
  nameI18n?: LocalizedString;
  descriptionI18n?: LocalizedString;
};

export type BoxNote = {
  id: string;
  text: string;
  authorUid: string;
  createdAt: number;
};

/**
 * Cloud-backed box (Firestore) shared within a room. Notes carry the author
 * UID so the client can filter "mine" vs "partner" without separate arrays.
 */
export type RoomBox = {
  id: string;
  name: string;
  color: string;
  icon: string;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
  notes: BoxNote[];
  confirmations: Record<string, boolean>; // uid -> confirmed
};
