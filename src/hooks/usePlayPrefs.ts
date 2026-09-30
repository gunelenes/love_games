import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_LEVEL, DEFAULT_TRACK } from '@/data/tracks';
import type { Level, Track } from '@/types';

const STORAGE_KEY = 'play:trackLevel:v1';

type Snapshot = {
  track: Track;
  level: Level;
};

/**
 * Wheel / Dice / Cards ekranlarının paylaştığı seçili track + level.
 * Değişiklikler AsyncStorage'a persist edilir; kullanıcı Cesur L3'te
 * bir oyunu bıraktıysa diğer oyunlara girdiğinde de aynı yerden başlar.
 */
export function usePlayPrefs() {
  const [track, setTrackState] = useState<Track>(DEFAULT_TRACK);
  const [level, setLevelState] = useState<Level>(DEFAULT_LEVEL);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (cancelled) return;
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as Partial<Snapshot>;
            if (parsed.track === 'romantik' || parsed.track === 'cesur') {
              setTrackState(parsed.track);
            }
            if (
              typeof parsed.level === 'number' &&
              parsed.level >= 1 &&
              parsed.level <= 5
            ) {
              setLevelState(parsed.level as Level);
            }
          } catch {
            // keep defaults
          }
        }
        setIsLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setIsLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback((next: Snapshot) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const setTrack = useCallback(
    (next: Track) => {
      setTrackState(next);
      persist({ track: next, level });
    },
    [level, persist]
  );

  const setLevel = useCallback(
    (next: Level) => {
      setLevelState(next);
      persist({ track, level: next });
    },
    [track, persist]
  );

  return { track, level, setTrack, setLevel, isLoaded };
}
