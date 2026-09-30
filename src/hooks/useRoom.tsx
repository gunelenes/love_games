import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, onSnapshot } from 'firebase/firestore';
import { firebaseFirestore } from '@/services/firebase';
import type { Room } from '@/services/roomService';

const STORAGE_KEY = 'room:code:v1';

type RoomContextValue = {
  code: string | null;      // cached room code the user is in
  room: Room | null;         // live room document from Firestore
  loading: boolean;
  setCode: (code: string | null) => Promise<void>;
  leave: () => Promise<void>;
};

const RoomContext = createContext<RoomContextValue | null>(null);

export function RoomProvider({ children }: { children: ReactNode }) {
  const [code, setCodeState] = useState<string | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);

  // 1) Load persisted room code on mount.
  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (cancelled) return;
        setCodeState(raw && raw.length === 6 ? raw : null);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // 2) Subscribe to Firestore room doc whenever code changes.
  useEffect(() => {
    if (!code || !firebaseFirestore) {
      setRoom(null);
      return;
    }
    const unsub = onSnapshot(
      doc(firebaseFirestore, 'rooms', code),
      (snap) => {
        if (snap.exists()) {
          setRoom(snap.data() as Room);
        } else {
          setRoom(null);
        }
      },
      () => setRoom(null)
    );
    return () => unsub();
  }, [code]);

  const setCode = useCallback(async (next: string | null) => {
    setCodeState(next);
    if (next) {
      await AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
    } else {
      await AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
    }
  }, []);

  const leave = useCallback(async () => {
    await setCode(null);
  }, [setCode]);

  return (
    <RoomContext.Provider value={{ code, room, loading, setCode, leave }}>
      {children}
    </RoomContext.Provider>
  );
}

export function useRoom() {
  const ctx = useContext(RoomContext);
  if (!ctx) throw new Error('useRoom must be used inside <RoomProvider>');
  return ctx;
}
