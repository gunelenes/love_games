import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_LEVEL, DEFAULT_TRACK } from '@/data/tracks';
import type { Level, Track } from '@/types';

const STORAGE_KEY = 'play:trackLevel:v1';

type Snapshot = {
  track: Track;
  level: Level;
};

type PlayPrefsContextValue = {
  track: Track;
  level: Level;
  setTrack: (next: Track) => void;
  setLevel: (next: Level) => void;
  isLoaded: boolean;
};

/**
 * Wheel / Cards / Dice / Poses ekranlarının paylaştığı seçili track + level.
 *
 * TEK bir provider'da tutulur ki ekran geçişinde flicker olmasın (ilk render
 * defaults, sonra AsyncStorage'dan cache değerine zıplama görünmez). Fresh
 * install'da hiçbir ekran cache görmez → tüm app defaults ile açılır
 * (Romantik L1). Bu kritik: Apple reviewer uygulamayı ilk kez açtığında
 * tame içerikle karşılaşmalı.
 */
const PlayPrefsContext = createContext<PlayPrefsContextValue | null>(null);

function isValidSnapshot(obj: unknown): obj is Snapshot {
  if (!obj || typeof obj !== 'object') return false;
  const s = obj as Partial<Snapshot>;
  const trackOk = s.track === 'romantik' || s.track === 'cesur';
  const levelOk =
    typeof s.level === 'number' &&
    Number.isInteger(s.level) &&
    s.level >= 1 &&
    s.level <= 5;
  return trackOk && levelOk;
}

export function PlayPrefsProvider({ children }: { children: ReactNode }) {
  const [track, setTrackState] = useState<Track>(DEFAULT_TRACK);
  const [level, setLevelState] = useState<Level>(DEFAULT_LEVEL);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then(async (raw) => {
        if (cancelled) return;
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (isValidSnapshot(parsed)) {
              setTrackState(parsed.track);
              setLevelState(parsed.level);
            } else {
              // Bozuk / eski şekli cache — temizle ki bir dahaki açılış
              // defaults'tan başlasın. Fresh install'ı simüle eder.
              // eslint-disable-next-line no-console
              console.warn(
                '[usePlayPrefs] cached snapshot invalid, resetting to defaults'
              );
              await AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
            }
          } catch {
            await AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
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

  return (
    <PlayPrefsContext.Provider
      value={{ track, level, setTrack, setLevel, isLoaded }}
    >
      {children}
    </PlayPrefsContext.Provider>
  );
}

export function usePlayPrefs(): PlayPrefsContextValue {
  const ctx = useContext(PlayPrefsContext);
  if (!ctx) {
    throw new Error('usePlayPrefs must be used inside <PlayPrefsProvider>');
  }
  return ctx;
}
