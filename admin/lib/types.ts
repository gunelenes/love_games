// Mirror of mobile app's Category / Place / PlaceCategory types.
// Keep in sync with love_games/src/types/index.ts.

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

export const TRACKS: Track[] = ['romantik', 'cesur'];
export const LEVELS: Level[] = [1, 2, 3, 4, 5];
export const FLAVORS: KinkFlavor[] = [
  'rope',
  'command',
  'petplay',
  'primal',
  'sensory',
  'roleplay',
  'impact',
];

export const FLAVOR_LABEL: Record<KinkFlavor, string> = {
  rope: '🪢 Halat',
  command: '🌙 Komut',
  petplay: '🐈 Pet',
  primal: '🐺 Primal',
  sensory: '🕶️ Sensory',
  roleplay: '🎭 Rol',
  impact: '✋ Impact',
};

export const TRACK_LABEL: Record<Track, string> = {
  romantik: 'Romantik (Yakınlık)',
  cesur: 'Cesur (Keşif)',
};

export const LEVEL_LABEL: Record<Track, Record<Level, string>> = {
  romantik: {
    1: 'L1 · Fısıltı',
    2: 'L2 · Yakınlık',
    3: 'L3 · Sırlar',
    4: 'L4 · Alev',
    5: 'L5 · Bağ',
  },
  cesur: {
    1: 'L1 · Kıvılcım',
    2: 'L2 · Işıltı',
    3: 'L3 · Cesaret',
    4: 'L4 · Zirve',
    5: 'L5 · Efsane',
  },
};

export type Category = {
  id: string;
  /** Default (tr) name — kept required for back-compat with existing data. */
  name: string;
  color: string;
  icon: string;
  prompts: string[];
  /** Optional English translation of `name`. */
  nameEn?: string;
  /**
   * Optional English translations of `prompts`. Same index as the tr
   * `prompts` overrides; empty slots fall back to tr.
   */
  promptsEn?: string[];
  order?: number;
  track: Track;
  level: Level;
  flavors?: KinkFlavor[];
};

export type Place = {
  name: string;
  description?: string;
  image?: string;
  nameEn?: string;
  descriptionEn?: string;
};

export type PlaceCategory = {
  id: string;
  name: string;
  color: string;
  icon: string;
  places: Place[];
  nameEn?: string;
  order?: number;
  track: Track;
  level: Level;
};
