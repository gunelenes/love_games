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
import { CATEGORIES as BUNDLE_CATEGORIES } from '@/data/categories';
import { DICE_FACES as BUNDLE_DICE_FACES } from '@/data/diceFaces';
import { PLACE_CATEGORIES as BUNDLE_PLACE_CATEGORIES } from '@/data/placeCategories';
import { fetchAllContent, type AllContent } from '@/services/contentService';
import type { Category, PlaceCategory } from '@/types';

const CACHE_KEY = 'content:v1';

type ContentContextValue = {
  categories: Category[];
  placeCategories: PlaceCategory[];
  diceFaces: Category[];
  source: 'bundle' | 'cache' | 'cloud';
  loading: boolean;
  refresh: () => Promise<void>;
};

const BUNDLE_CONTENT = {
  categories: BUNDLE_CATEGORIES,
  placeCategories: BUNDLE_PLACE_CATEGORIES,
  diceFaces: BUNDLE_DICE_FACES,
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
  const [source, setSource] = useState<'bundle' | 'cache' | 'cloud'>('bundle');
  const [loading, setLoading] = useState(true);

  const applyContent = useCallback(
    (content: AllContent, newSource: 'cache' | 'cloud') => {
      setCategories(content.categories);
      setPlaceCategories(content.placeCategories);
      setDiceFaces(content.diceFaces);
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

  const value = useMemo<ContentContextValue>(
    () => ({
      categories,
      placeCategories,
      diceFaces,
      source,
      loading,
      refresh,
    }),
    [categories, placeCategories, diceFaces, source, loading, refresh]
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
