export type Category = {
  id: string;
  name: string;
  color: string;
  icon: string;
  prompts: string[];
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
