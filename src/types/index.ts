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
  createdAt: number;
};

export type Box = {
  id: string;
  name: string;
  color: string;
  icon: string;
  createdAt: number;
  updatedAt: number;
  myNotes: BoxNote[];
  partnerNotes: BoxNote[];
  myConfirmed: boolean;
  partnerConfirmed: boolean;
  lastSyncAt?: number;
};

/** Blob that travels between phones via QR or short code. */
export type BoxSyncBlob = {
  v: 1;
  boxId: string;
  boxName: string;
  boxColor: string;
  boxIcon: string;
  notes: BoxNote[];   // sender's `myNotes`
  confirmed: boolean; // sender's `myConfirmed`
  ts: number;
};
