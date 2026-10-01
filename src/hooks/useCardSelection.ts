import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Category } from '@/types';

const STORAGE_PREFIX = 'cards:selectedIds:v2';
const MIN_ACTIVE = 1;

/**
 * Kart ekranı için kategori seçimi.
 * `scopeKey` (ör. "romantik:1") değişince seçim sıfırlanır ve o scope'un kendi
 * AsyncStorage anahtarından yüklenir. Böylece track/level değişince eski ID'ler
 * ortalıkta kalmaz ve "görünür ama çalışmaz" durumu oluşmaz.
 */
export function useCardSelection(categories: Category[], scopeKey: string) {
  const storageKey = `${STORAGE_PREFIX}:${scopeKey}`;
  const categoriesRef = useRef(categories);
  categoriesRef.current = categories;

  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(categories.map((c) => c.id))
  );
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoaded(false);
    AsyncStorage.getItem(storageKey)
      .then((raw) => {
        if (cancelled) return;
        const cats = categoriesRef.current;
        const known = new Set(cats.map((c) => c.id));
        let next: Set<string> | null = null;
        if (raw) {
          try {
            const parsed: unknown = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              const filtered = parsed.filter(
                (id): id is string => typeof id === 'string' && known.has(id)
              );
              if (filtered.length > 0) next = new Set(filtered);
            }
          } catch {
            // corrupt — fall through to defaults
          }
        }
        setSelectedIds(next ?? known);
        setIsLoaded(true);
      })
      .catch(() => {
        if (cancelled) return;
        const cats = categoriesRef.current;
        setSelectedIds(new Set(cats.map((c) => c.id)));
        setIsLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [storageKey]);

  const persist = useCallback(
    (next: Set<string>) => {
      AsyncStorage.setItem(storageKey, JSON.stringify([...next])).catch(() => {});
    },
    [storageKey]
  );

  const selectedCategories = useMemo(
    () => categories.filter((c) => selectedIds.has(c.id)),
    [selectedIds, categories]
  );

  const totalPrompts = useMemo(
    () => selectedCategories.reduce((sum, c) => sum + c.prompts.length, 0),
    [selectedCategories]
  );

  const visibleSelectedCount = selectedCategories.length;

  const toggle = useCallback(
    (id: string) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        const cats = categoriesRef.current;
        if (next.has(id)) {
          const stillActiveAfterRemove = cats.filter(
            (c) => c.id !== id && next.has(c.id)
          ).length;
          if (stillActiveAfterRemove < MIN_ACTIVE) return prev;
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
    const next = new Set(categoriesRef.current.map((c) => c.id));
    setSelectedIds(next);
    persist(next);
  }, [persist]);

  const canDeselect = useCallback(
    (id: string) => {
      if (!selectedIds.has(id)) return false;
      return visibleSelectedCount > MIN_ACTIVE;
    },
    [selectedIds, visibleSelectedCount]
  );

  return {
    selectedIds,
    selectedCategories,
    selectedCount: visibleSelectedCount,
    totalPrompts,
    isLoaded,
    toggle,
    selectAll,
    canDeselect,
  };
}
