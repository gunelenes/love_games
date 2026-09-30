import { useCallback, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Category } from '@/types';

const STORAGE_KEY = 'cards:selectedIds:v1';
const MIN_ACTIVE = 1;

export function useCardSelection(categories: Category[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
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
              if (filtered.length > 0) {
                setSelectedIds(new Set(filtered));
              }
            }
          } catch {
            // keep default
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
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...next])).catch(() => {});
  }, []);

  const toggle = useCallback(
    (id: string) => {
      setSelectedIds((prev) => {
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

  const selectAll = useCallback(() => {
    const next = new Set(categories.map((c) => c.id));
    setSelectedIds(next);
    persist(next);
  }, [categories, persist]);

  const selectedCategories = useMemo(
    () => categories.filter((c) => selectedIds.has(c.id)),
    [selectedIds, categories]
  );

  const totalPrompts = useMemo(
    () => selectedCategories.reduce((sum, c) => sum + c.prompts.length, 0),
    [selectedCategories]
  );

  const canDeselect = useCallback(
    (id: string) => selectedIds.has(id) && selectedIds.size > MIN_ACTIVE,
    [selectedIds]
  );

  return {
    selectedIds,
    selectedCategories,
    selectedCount: selectedIds.size,
    totalPrompts,
    isLoaded,
    toggle,
    selectAll,
    canDeselect,
  };
}
