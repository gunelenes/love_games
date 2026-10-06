import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { CATEGORIES as BUNDLE_CATEGORIES } from '@/data/categories';
import { DICE_FACES as BUNDLE_DICE_FACES } from '@/data/diceFaces';
import { PLACE_CATEGORIES as BUNDLE_PLACE_CATEGORIES } from '@/data/placeCategories';
import { POSES as BUNDLE_POSES } from '@/data/poses';
import { fetchAllContent, type AllContent } from '@/services/contentService';
import {
  localizeCategory,
  localizePlaceCategory,
  localizePose,
} from '@/utils/localizedContent';
import type { Category, PlaceCategory, Pose } from '@/types';

// Bumped from v1 → v2: Pose cache was added; older bundles don't carry poses.
const CACHE_KEY = 'content:v2';

type ContentContextValue = {
  categories: Category[];
  placeCategories: PlaceCategory[];
  diceFaces: Category[];
  poses: Pose[];
  source: 'bundle' | 'cache' | 'cloud';
  loading: boolean;
  refresh: () => Promise<void>;
};

const BUNDLE_CONTENT = {
  categories: BUNDLE_CATEGORIES,
  placeCategories: BUNDLE_PLACE_CATEGORIES,
  diceFaces: BUNDLE_DICE_FACES,
  poses: BUNDLE_POSES,
  version: null as number | null,
};

const ContentContext = createContext<ContentContextValue | null>(null);

async function readCache(): Promise<AllContent | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      Array.isArray(parsed?.categories) &&
      Array.isArray(parsed?.placeCategories) &&
      Array.isArray(parsed?.diceFaces)
    ) {
      return {
        categories: parsed.categories,
        placeCategories: parsed.placeCategories,
        diceFaces: parsed.diceFaces,
        poses: Array.isArray(parsed.poses) ? parsed.poses : [],
        version: typeof parsed.version === 'number' ? parsed.version : null,
      };
    }
  } catch {
    // corrupt cache — ignore
  }
  return null;
}

async function writeCache(content: AllContent) {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(content));
  } catch {
    // ignore write failure
  }
}

export function ContentProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>(
    BUNDLE_CONTENT.categories
  );
  const [placeCategories, setPlaceCategories] = useState<PlaceCategory[]>(
    BUNDLE_CONTENT.placeCategories
  );
  const [diceFaces, setDiceFaces] = useState<Category[]>(
    BUNDLE_CONTENT.diceFaces
  );
  const [poses, setPoses] = useState<Pose[]>(BUNDLE_CONTENT.poses);
  const [source, setSource] = useState<'bundle' | 'cache' | 'cloud'>('bundle');
  const [loading, setLoading] = useState(true);

  const applyContent = useCallback(
    (content: AllContent, newSource: 'cache' | 'cloud') => {
      setCategories(content.categories);
      setPlaceCategories(content.placeCategories);
      setDiceFaces(content.diceFaces);
      // Cloud/cache is authoritative for poses once any have been seeded.
      // If Firestore has zero poses yet, keep the bundled fallback visible
      // so the Pozlar screen is never empty on fresh installs.
      setPoses(content.poses.length > 0 ? content.poses : BUNDLE_CONTENT.poses);
      setSource(newSource);
    },
    []
  );

  const refresh = useCallback(async () => {
    const cloud = await fetchAllContent();
    if (cloud) {
      applyContent(cloud, 'cloud');
      void writeCache(cloud);
    }
  }, [applyContent]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // 1) show cache immediately (if any)
      const cached = await readCache();
      if (!cancelled && cached) {
        applyContent(cached, 'cache');
      }
      // 2) background fetch from cloud
      const cloud = await fetchAllContent();
      if (!cancelled) {
        if (cloud) {
          applyContent(cloud, 'cloud');
          void writeCache(cloud);
        }
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applyContent]);

  // react-i18next subscription: when the language changes we need to
  // re-emit a localized view of the raw content so every consumer
  // (which selects via cat.name / cat.prompts / place.name) picks up
  // the new strings without each one knowing about i18n.
  const { i18n } = useTranslation();
  const lang = i18n.language;

  const localizedCategories = useMemo(
    () => categories.map(localizeCategory),
    [categories, lang]
  );
  const localizedPlaceCategories = useMemo(
    () => placeCategories.map(localizePlaceCategory),
    [placeCategories, lang]
  );
  const localizedDiceFaces = useMemo(
    () => diceFaces.map(localizeCategory),
    [diceFaces, lang]
  );
  const localizedPoses = useMemo(
    () => poses.map(localizePose),
    [poses, lang]
  );

  const value = useMemo<ContentContextValue>(
    () => ({
      categories: localizedCategories,
      placeCategories: localizedPlaceCategories,
      diceFaces: localizedDiceFaces,
      poses: localizedPoses,
      source,
      loading,
      refresh,
    }),
    [
      localizedCategories,
      localizedPlaceCategories,
      localizedDiceFaces,
      localizedPoses,
      source,
      loading,
      refresh,
    ]
  );

  return (
    <ContentContext.Provider value={value}>{children}</ContentContext.Provider>
  );
}

export function useContent(): ContentContextValue {
  const ctx = useContext(ContentContext);
  if (!ctx) {
    throw new Error('useContent must be used inside <ContentProvider>');
  }
  return ctx;
}
