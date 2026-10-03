import type { Level, Track } from '@/types';

export const TRACKS: Track[] = ['romantik', 'cesur'];
export const LEVELS: Level[] = [1, 2, 3, 4, 5];

/**
 * Only visual metadata lives here. User-facing labels/taglines/level names
 * come from `i18n/locales/{lang}.json` under the `tracks.*` namespace.
 */
export const TRACK_META: Record<Track, { color: string; icon: string }> = {
  romantik: { color: '#FF4D6D', icon: '💗' },
  cesur: { color: '#B91C4D', icon: '🔥' },
};

export const DEFAULT_TRACK: Track = 'romantik';
export const DEFAULT_LEVEL: Level = 1;
