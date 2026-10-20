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

/**
 * Translation maps keyed by locale code. Mirror of mobile `LocalizedString`
 * / `LocalizedStringArray` in src/types/index.ts — keep both in sync.
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
  order?: number;
  track: Track;
  level: Level;
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
  order?: number;
  track: Track;
  level: Level;
};

/**
 * Art deck card (Pozlar + Göz Ucuyla). Mirrors the mobile `Pose` type in
 * src/types/index.ts — keep in sync. `image` is a Firebase Storage
 * download URL, `imagePath` the object path (for deleting the blob).
 */
export type ArtDeck = 'poses' | 'glimpses';

export type ArtCard = {
  id: string;
  name: string;
  description?: string;
  image: string;
  imagePath?: string;
  nameI18n?: LocalizedString;
  descriptionI18n?: LocalizedString;
  order?: number;
};

export type SubmissionStatus = 'new' | 'reviewed' | 'implemented' | 'rejected';

export type Submission = {
  id: string;
  text: string;
  uid: string;
  locale: string;
  status: SubmissionStatus;
  createdAt?: { seconds: number; nanoseconds: number } | null;
  note?: string;
};

export const SUBMISSION_STATUSES: SubmissionStatus[] = [
  'new',
  'reviewed',
  'implemented',
  'rejected',
];

export const SUBMISSION_STATUS_LABEL: Record<SubmissionStatus, string> = {
  new: '🆕 Yeni',
  reviewed: '👀 İncelendi',
  implemented: '✅ Eklendi',
  rejected: '❌ Reddedildi',
};

/**
 * Safety report filed from the mobile Boxes screens (App Store §1.2).
 * Mirrors the payload of submitReport in src/services/safetyService.ts.
 */
export type ReportReason = 'harassment' | 'inappropriate' | 'spam' | 'other';
export type ReportStatus = 'new' | 'actioned' | 'dismissed';

export type Report = {
  id: string;
  uid: string;
  roomCode: string;
  reportedUid: string | null;
  reason: ReportReason;
  details: string;
  noteText: string;
  locale: string;
  status: ReportStatus;
  createdAt?: { seconds: number; nanoseconds: number } | null;
};

export const REPORT_STATUSES: ReportStatus[] = ['new', 'actioned', 'dismissed'];

export const REPORT_STATUS_LABEL: Record<ReportStatus, string> = {
  new: '🚩 Yeni',
  actioned: '✅ İşlem yapıldı',
  dismissed: '➖ Geçersiz',
};

export const REPORT_REASON_LABEL: Record<ReportReason, string> = {
  harassment: 'Taciz / tehdit',
  inappropriate: 'İstenmeyen / rahatsız edici içerik',
  spam: 'Spam',
  other: 'Diğer',
};
