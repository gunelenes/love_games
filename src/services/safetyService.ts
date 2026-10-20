import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { firebaseAuth, firebaseFirestore } from './firebase';
import type { Room } from './roomService';
import i18n from '@/i18n';
import type { BoxNote } from '@/types';

/**
 * App Store §1.2 safety tools for Boxes (the only place one user sees
 * another's content): leave a room for real, remove + block a partner,
 * and report a note or a partner.
 *
 * Blocking works on two levels:
 *  - room.blockedUids — enforced by firestore.rules, so a blocked uid can
 *    never rejoin that room, even with the code.
 *  - a per-device list (BLOCKED_KEY) — seeds blockedUids into every room
 *    this user creates later, and makes joinRoom refuse rooms hosted by
 *    someone this user blocked.
 */

const BLOCKED_KEY = 'safety:blocked:v1';

export async function getLocalBlocked(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(BLOCKED_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

async function addLocalBlocked(uid: string) {
  const current = await getLocalBlocked();
  if (current.includes(uid)) return;
  await AsyncStorage.setItem(BLOCKED_KEY, JSON.stringify([...current, uid])).catch(
    () => {}
  );
}

function roomRef(code: string) {
  return doc(firebaseFirestore!, 'rooms', code);
}

/**
 * Leave the room on the server, not just on this phone.
 *  - guest: frees the guest slot.
 *  - host with a partner: hands the room over to the partner.
 *  - host alone: deletes every box, then the room (boxes first — their
 *    rule reads the room doc to check membership).
 */
export async function leaveRoom(code: string, uid: string): Promise<void> {
  if (!firebaseFirestore) return;
  const snap = await getDoc(roomRef(code));
  if (!snap.exists()) return;
  const room = snap.data() as Room;

  if (room.guestUid === uid) {
    await updateDoc(roomRef(code), { guestUid: null });
    return;
  }
  if (room.hostUid !== uid) return;

  if (room.guestUid) {
    await updateDoc(roomRef(code), { hostUid: room.guestUid, guestUid: null });
    return;
  }
  const boxes = await getDocs(collection(firebaseFirestore, 'rooms', code, 'boxes'));
  if (!boxes.empty) {
    const batch = writeBatch(firebaseFirestore);
    boxes.forEach((b) => batch.delete(b.ref));
    await batch.commit();
  }
  await deleteDoc(roomRef(code));
}

/**
 * Remove and block the partner.
 *  - host: strips the partner's notes + confirmations from every box,
 *    frees the guest slot and adds them to room.blockedUids.
 *  - guest: the room belongs to the host, so blocking means leaving it
 *    and refusing that host's rooms from now on.
 */
export async function blockPartner(
  code: string,
  uid: string,
  partnerUid: string
): Promise<void> {
  if (!firebaseFirestore) return;
  await addLocalBlocked(partnerUid);

  const snap = await getDoc(roomRef(code));
  if (!snap.exists()) return;
  const room = snap.data() as Room;

  if (room.hostUid !== uid) {
    await leaveRoom(code, uid);
    return;
  }

  const boxes = await getDocs(collection(firebaseFirestore, 'rooms', code, 'boxes'));
  if (!boxes.empty) {
    const batch = writeBatch(firebaseFirestore);
    boxes.forEach((b) => {
      const notes = ((b.data().notes ?? []) as BoxNote[]).filter(
        (n) => n.authorUid !== partnerUid
      );
      batch.update(b.ref, {
        notes,
        [`confirmations.${partnerUid}`]: deleteField(),
        updatedAt: Date.now(),
      });
    });
    await batch.commit();
  }
  await updateDoc(roomRef(code), {
    guestUid: null,
    blockedUids: arrayUnion(partnerUid),
  });
}

export const REPORT_REASONS = ['harassment', 'inappropriate', 'spam', 'other'] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export const REPORT_DETAILS_MAX = 500;

export async function submitReport(input: {
  roomCode: string;
  reportedUid: string | null;
  reason: ReportReason;
  details?: string;
  /** The reported note, copied so it survives a later delete. */
  noteText?: string;
}): Promise<void> {
  if (!firebaseFirestore) throw new Error('Firebase not configured');
  const uid = firebaseAuth?.currentUser?.uid;
  if (!uid) throw new Error('Not signed in');
  const details = (input.details ?? '').trim().slice(0, REPORT_DETAILS_MAX);
  await addDoc(collection(firebaseFirestore, 'reports'), {
    uid,
    roomCode: input.roomCode,
    reportedUid: input.reportedUid,
    reason: input.reason,
    details,
    noteText: (input.noteText ?? '').slice(0, 1000),
    locale: i18n.language || 'en',
    status: 'new',
    createdAt: serverTimestamp(),
  });
}
