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

export type Category = {
  id: string;
  name: string;
  color: string;
  icon: string;
  prompts: string[];
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
};

export type PlaceCategory = {
  id: string;
  name: string;
  color: string;
  icon: string;
  places: Place[];
  track: Track;
  level: Level;
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
