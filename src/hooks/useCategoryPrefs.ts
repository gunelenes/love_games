import { useCallback, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Category } from '@/types';

const STORAGE_KEY = 'wheel:activeCategoryIds:v1';
const MIN_ACTIVE = 3;

export function useCategoryPrefs(categories: Category[]) {
  const [activeIds, setActiveIds] = useState<Set<string>>(
    () => new Set(categories.map((c) => c.id))
  );
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (cancelled) return;
        if (raw) {
          try {
            const parsed: unknown = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              const known = new Set(categories.map((c) => c.id));
              const filtered = parsed.filter(
                (id): id is string => typeof id === 'string' && known.has(id)
              );
              if (filtered.length >= MIN_ACTIVE) {
                setActiveIds(new Set(filtered));
              } else if (filtered.length > 0) {
                // Persisted set exists but shrunk below min (content changed).
                // Take it as-is; UI will guide user to enable more.
                setActiveIds(new Set(filtered));
              }
            }
          } catch {
            // corrupted value — keep default (all enabled)
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
  }, [categories]);

  const persist = useCallback((next: Set<string>) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...next])).catch(() => {
      // Ignore write errors; app still works in-memory this session.
    });
  }, []);

  const toggle = useCallback(
    (id: string) => {
      setActiveIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          if (next.size <= MIN_ACTIVE) return prev;
          next.delete(id);
        } else {
          next.add(id);
        }
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const activeCategories = useMemo(
    () => categories.filter((c) => activeIds.has(c.id)),
    [activeIds, categories]
  );

  const canDisable = useCallback(
    (id: string) => activeIds.has(id) && activeIds.size > MIN_ACTIVE,
    [activeIds]
  );

  return {
    activeIds,
    activeCategories,
    activeCount: activeIds.size,
    totalCount: categories.length,
    minActive: MIN_ACTIVE,
    isLoaded,
    toggle,
    canDisable,
  };
}
