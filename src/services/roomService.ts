import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { firebaseFirestore } from './firebase';

// Unambiguous alphabet (excludes 0/O/1/I/L)
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;

function generateCode(): string {
  let out = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return out;
}

export type Room = {
  code: string;
  hostUid: string;
  guestUid: string | null;
  createdAt: number;
  active: boolean;
};

export type CreateRoomResult =
  | { status: 'ok'; code: string }
  | { status: 'error'; message: string };

export type JoinRoomResult =
  | { status: 'ok'; code: string }
  | { status: 'not_found' }
  | { status: 'full' }
  | { status: 'error'; message: string };

/**
 * Yeni oda oluştur. Kod çakışması olursa yeniden dene (birkaç kez).
 * Host olarak mevcut UID kaydedilir.
 */
export async function createRoom(hostUid: string): Promise<CreateRoomResult> {
  if (!firebaseFirestore) {
    return { status: 'error', message: 'Firestore hazır değil' };
  }
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode();
    try {
      const success = await runTransaction(firebaseFirestore, async (tx) => {
        const ref = doc(firebaseFirestore!, 'rooms', code);
        const snap = await tx.get(ref);
        if (snap.exists()) return false;
        tx.set(ref, {
          code,
          hostUid,
          guestUid: null,
          createdAt: serverTimestamp(),
          active: true,
        });
        return true;
      });
      if (success) return { status: 'ok', code };
    } catch (e: any) {
      return { status: 'error', message: e?.message || String(e) };
    }
  }
  return { status: 'error', message: 'Kod üretilemedi, tekrar dene' };
}

/**
 * Var olan bir odaya katıl. Oda dolu değilse guestUid olarak yazılır.
 * Zaten host veya guest ise başarılı sayılır (idempotent).
 */
export async function joinRoom(
  code: string,
  uid: string
): Promise<JoinRoomResult> {
  if (!firebaseFirestore) {
    return { status: 'error', message: 'Firestore hazır değil' };
  }
  const normalized = code.trim().toUpperCase();
  if (!/^[A-Z2-9]{6}$/.test(normalized)) {
    return { status: 'not_found' };
  }
  try {
    return await runTransaction<JoinRoomResult>(
      firebaseFirestore,
      async (tx) => {
        const ref = doc(firebaseFirestore!, 'rooms', normalized);
        const snap = await tx.get(ref);
        if (!snap.exists()) return { status: 'not_found' };
        const data = snap.data() as Room;
        if (data.hostUid === uid || data.guestUid === uid) {
          return { status: 'ok', code: normalized };
        }
        if (data.guestUid && data.guestUid !== uid) {
          return { status: 'full' };
        }
        tx.update(ref, { guestUid: uid });
        return { status: 'ok', code: normalized };
      }
    );
  } catch (e: any) {
    return { status: 'error', message: e?.message || String(e) };
  }
}

export async function fetchRoom(code: string): Promise<Room | null> {
  if (!firebaseFirestore) return null;
  const snap = await getDoc(doc(firebaseFirestore, 'rooms', code));
  if (!snap.exists()) return null;
  return snap.data() as Room;
}
