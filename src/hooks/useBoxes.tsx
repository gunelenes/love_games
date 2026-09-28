import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Box, BoxNote, BoxSyncBlob } from '@/types';

const STORAGE_KEY = 'boxes:v1';

function genId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

type ApplySyncResult =
  | { status: 'created'; boxId: string }
  | { status: 'updated'; boxId: string }
  | { status: 'stale' }
  | { status: 'invalid' };

type BoxesContextValue = {
  boxes: Box[];
  isLoaded: boolean;
  getBox: (id: string) => Box | undefined;
  createBox: (name: string, color: string, icon: string) => Box;
  renameBox: (id: string, name: string) => void;
  deleteBox: (id: string) => void;
  addNote: (boxId: string, text: string) => void;
  updateNote: (boxId: string, noteId: string, text: string) => void;
  deleteNote: (boxId: string, noteId: string) => void;
  setMyConfirmed: (boxId: string, confirmed: boolean) => void;
  applySyncBlob: (blob: BoxSyncBlob) => ApplySyncResult;
};

const BoxesContext = createContext<BoxesContextValue | null>(null);

export function BoxesProvider({ children }: { children: ReactNode }) {
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const boxesRef = useRef<Box[]>([]);

  // Keep ref in sync so persist() reads latest without stale closures.
  useEffect(() => {
    boxesRef.current = boxes;
  }, [boxes]);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (cancelled) return;
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              setBoxes(parsed as Box[]);
            }
          } catch {
            // corrupted — keep empty
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

  const persist = useCallback((next: Box[]) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {
      // ignore — the in-memory copy stays authoritative this session
    });
  }, []);

  const commit = useCallback(
    (updater: (prev: Box[]) => Box[]) => {
      setBoxes((prev) => {
        const next = updater(prev);
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const getBox = useCallback(
    (id: string) => boxesRef.current.find((b) => b.id === id),
    []
  );

  const createBox = useCallback(
    (name: string, color: string, icon: string): Box => {
      const now = Date.now();
      const box: Box = {
        id: genId(),
        name: name.trim() || 'Kutu',
        color,
        icon,
        createdAt: now,
        updatedAt: now,
        myNotes: [],
        partnerNotes: [],
        myConfirmed: false,
        partnerConfirmed: false,
      };
      commit((prev) => [box, ...prev]);
      return box;
    },
    [commit]
  );

  const renameBox = useCallback(
    (id: string, name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      commit((prev) =>
        prev.map((b) =>
          b.id === id ? { ...b, name: trimmed, updatedAt: Date.now() } : b
        )
      );
    },
    [commit]
  );

  const deleteBox = useCallback(
    (id: string) => {
      commit((prev) => prev.filter((b) => b.id !== id));
    },
    [commit]
  );

  const addNote = useCallback(
    (boxId: string, text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const note: BoxNote = {
        id: genId(),
        text: trimmed,
        createdAt: Date.now(),
      };
      commit((prev) =>
        prev.map((b) =>
          b.id === boxId
            ? {
                ...b,
                myNotes: [...b.myNotes, note],
                myConfirmed: false, // adding a note re-opens the box for you
                updatedAt: Date.now(),
              }
            : b
        )
      );
    },
    [commit]
  );

  const updateNote = useCallback(
    (boxId: string, noteId: string, text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      commit((prev) =>
        prev.map((b) =>
          b.id === boxId
            ? {
                ...b,
                myNotes: b.myNotes.map((n) =>
                  n.id === noteId ? { ...n, text: trimmed } : n
                ),
                myConfirmed: false,
                updatedAt: Date.now(),
              }
            : b
        )
      );
    },
    [commit]
  );

  const deleteNote = useCallback(
    (boxId: string, noteId: string) => {
      commit((prev) =>
        prev.map((b) =>
          b.id === boxId
            ? {
                ...b,
                myNotes: b.myNotes.filter((n) => n.id !== noteId),
                myConfirmed: false,
                updatedAt: Date.now(),
              }
            : b
        )
      );
    },
    [commit]
  );

  const setMyConfirmed = useCallback(
    (boxId: string, confirmed: boolean) => {
      commit((prev) =>
        prev.map((b) =>
          b.id === boxId
            ? { ...b, myConfirmed: confirmed, updatedAt: Date.now() }
            : b
        )
      );
    },
    [commit]
  );

  const applySyncBlob = useCallback(
    (blob: BoxSyncBlob): ApplySyncResult => {
      if (!blob || blob.v !== 1 || typeof blob.boxId !== 'string') {
        return { status: 'invalid' };
      }
      let outcome: ApplySyncResult = { status: 'invalid' };
      commit((prev) => {
        const existing = prev.find((b) => b.id === blob.boxId);
        const now = Date.now();
        if (existing) {
          if (existing.lastSyncAt && blob.ts < existing.lastSyncAt) {
            outcome = { status: 'stale' };
            return prev;
          }
          outcome = { status: 'updated', boxId: blob.boxId };
          return prev.map((b) =>
            b.id === blob.boxId
              ? {
                  ...b,
                  partnerNotes: blob.notes,
                  partnerConfirmed: blob.confirmed,
                  lastSyncAt: blob.ts,
                  updatedAt: now,
                }
              : b
          );
        }
        // New box arriving from a partner
        const newBox: Box = {
          id: blob.boxId,
          name: blob.boxName,
          color: blob.boxColor,
          icon: blob.boxIcon,
          createdAt: now,
          updatedAt: now,
          myNotes: [],
          partnerNotes: blob.notes,
          myConfirmed: false,
          partnerConfirmed: blob.confirmed,
          lastSyncAt: blob.ts,
        };
        outcome = { status: 'created', boxId: blob.boxId };
        return [newBox, ...prev];
      });
      return outcome;
    },
    [commit]
  );

  const value = useMemo<BoxesContextValue>(
    () => ({
      boxes,
      isLoaded,
      getBox,
      createBox,
      renameBox,
      deleteBox,
      addNote,
      updateNote,
      deleteNote,
      setMyConfirmed,
      applySyncBlob,
    }),
    [
      boxes,
      isLoaded,
      getBox,
      createBox,
      renameBox,
      deleteBox,
      addNote,
      updateNote,
      deleteNote,
      setMyConfirmed,
      applySyncBlob,
    ]
  );

  return (
    <BoxesContext.Provider value={value}>{children}</BoxesContext.Provider>
  );
}

export function useBoxes(): BoxesContextValue {
  const ctx = useContext(BoxesContext);
  if (!ctx) {
    throw new Error('useBoxes must be used inside <BoxesProvider>');
  }
  return ctx;
}
