// Mirror of mobile app's Category / Place / PlaceCategory types.
// Keep in sync with love_games/src/types/index.ts.

export type Category = {
  id: string;
  name: string;
  color: string;
  icon: string;
  prompts: string[];
  order?: number;
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
  order?: number;
};
