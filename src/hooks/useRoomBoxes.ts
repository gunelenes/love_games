import { useEffect, useState } from 'react';
import { subscribeBoxes } from '@/services/boxService';
import type { RoomBox } from '@/types';

/**
 * Real-time list of boxes for a given room. Empty array if roomCode is null
 * (e.g., user hasn't joined a room yet).
 */
export function useRoomBoxes(roomCode: string | null) {
  const [boxes, setBoxes] = useState<RoomBox[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomCode) {
      setBoxes([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeBoxes(
      roomCode,
      (list) => {
        setBoxes(list);
        setLoading(false);
      },
      (e: any) => {
        setError(e?.message || String(e));
        setLoading(false);
      }
    );
    return () => unsub();
  }, [roomCode]);

  return { boxes, loading, error };
}
