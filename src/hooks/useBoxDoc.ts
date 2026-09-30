import { useEffect, useState } from 'react';
import { subscribeBox } from '@/services/boxService';
import type { RoomBox } from '@/types';

/**
 * Real-time subscription to a single box document.
 * Returns null while loading or if the box doesn't exist.
 */
export function useBoxDoc(roomCode: string | null, boxId: string | null) {
  const [box, setBox] = useState<RoomBox | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roomCode || !boxId) {
      setBox(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeBox(
      roomCode,
      boxId,
      (data) => {
        setBox(data);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, [roomCode, boxId]);

  return { box, loading };
}
