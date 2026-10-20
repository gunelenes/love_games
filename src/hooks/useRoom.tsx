import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, onSnapshot } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { firebaseFirestore } from '@/services/firebase';
import type { Room } from '@/services/roomService';
import { blockPartner, leaveRoom } from '@/services/safetyService';

const STORAGE_KEY = 'room:code:v1';

/** Why this phone was taken out of its room, shown once in the lobby. */
export type RoomNotice = 'removed' | 'closed';

type RoomContextValue = {
  code: string | null;      // cached room code the user is in
  room: Room | null;         // live room document from Firestore
  loading: boolean;
  /** The other member's uid, or null while the guest slot is empty. */
  partnerUid: string | null;
  notice: RoomNotice | null;
  clearNotice: () => void;
  setCode: (code: string | null) => Promise<void>;
  /** Leave on the server too (frees the slot / hands over / closes). */
  leave: () => Promise<void>;
  /** Remove + block the partner (see safetyService.blockPartner). */
  block: () => Promise<void>;
};

const RoomContext = createContext<RoomContextValue | null>(null);

export function RoomProvider({ children }: { children: ReactNode }) {
  const { uid } = useAuth();
  const [code, setCodeState] = useState<string | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<RoomNotice | null>(null);
  // Set while this phone itself leaves, so the snapshot that follows is
  // not mistaken for being removed by the partner.
  const leavingRef = useRef(false);

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
          // Doc gone while we still hold its code: the host closed it.
          if (!leavingRef.current) {
            setNotice('closed');
            void AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
            setCodeState(null);
          }
        }
      },
      () => setRoom(null)
    );
    return () => unsub();
  }, [code]);

  const setCode = useCallback(async (next: string | null) => {
    setCodeState(next);
    if (next) {
      setNotice(null);
      await AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
    } else {
      await AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
    }
  }, []);

  // 3) The partner removed/blocked us, or the room was closed: drop the
  //    cached code so the user lands back in the lobby with an explanation.
  useEffect(() => {
    if (!code || !uid || leavingRef.current || !firebaseFirestore) return;
    if (room && room.hostUid !== uid && room.guestUid !== uid) {
      setNotice('removed');
      void setCode(null);
    }
  }, [room, code, uid, setCode]);

  const partnerUid =
    room && uid
      ? [room.hostUid, room.guestUid].find((u) => u && u !== uid) ?? null
      : null;

  const leave = useCallback(async () => {
    if (!code) return;
    leavingRef.current = true;
    try {
      if (uid) await leaveRoom(code, uid).catch(() => {});
      await setCode(null);
    } finally {
      leavingRef.current = false;
    }
  }, [code, uid, setCode]);

  const block = useCallback(async () => {
    if (!code || !uid || !partnerUid) return;
    const isHost = room?.hostUid === uid;
    leavingRef.current = !isHost;
    try {
      await blockPartner(code, uid, partnerUid);
      // A guest who blocks the host has left the room with it.
      if (!isHost) await setCode(null);
    } finally {
      leavingRef.current = false;
    }
  }, [code, uid, partnerUid, room, setCode]);

  const clearNotice = useCallback(() => setNotice(null), []);

  return (
    <RoomContext.Provider
      value={{
        code,
        room,
        loading,
        partnerUid,
        notice,
        clearNotice,
        setCode,
        leave,
        block,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
}

export function useRoom() {
  const ctx = useContext(RoomContext);
  if (!ctx) throw new Error('useRoom must be used inside <RoomProvider>');
  return ctx;
}
