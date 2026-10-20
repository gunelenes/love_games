import {
  arrayUnion,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { firebaseFirestore } from './firebase';
import type { Report, ReportStatus } from './types';

function db() {
  if (!firebaseFirestore) throw new Error('Firestore not configured');
  return firebaseFirestore;
}

export async function listReports(): Promise<Report[]> {
  if (!firebaseFirestore) return [];
  const snap = await getDocs(query(collection(firebaseFirestore, 'reports'), orderBy('createdAt', 'desc')));
  const items: Report[] = [];
  snap.forEach((d) => {
    const data = d.data() as Omit<Report, 'id'>;
    items.push({ id: d.id, ...data, status: data.status || 'new' });
  });
  return items;
}

export async function setReportStatus(id: string, status: ReportStatus) {
  await updateDoc(doc(db(), 'reports', id), { status });
}

export async function deleteReport(id: string) {
  await deleteDoc(doc(db(), 'reports', id));
}

export type RoomState = {
  exists: boolean;
  hostUid?: string;
  guestUid?: string | null;
  blocked: boolean;
};

/** Where the reported user stands in the room right now. */
export async function inspectRoom(code: string, reportedUid: string | null): Promise<RoomState> {
  const snap = await getDoc(doc(db(), 'rooms', code));
  if (!snap.exists()) return { exists: false, blocked: false };
  const data = snap.data();
  return {
    exists: true,
    hostUid: data.hostUid,
    guestUid: data.guestUid ?? null,
    blocked: !!reportedUid && (data.blockedUids ?? []).includes(reportedUid),
  };
}

/** Delete every note the reported user wrote in this room. Returns count removed. */
export async function removeUserNotes(code: string, uid: string): Promise<number> {
  const boxes = await getDocs(collection(db(), 'rooms', code, 'boxes'));
  const batch = writeBatch(db());
  let removed = 0;
  boxes.forEach((b) => {
    const notes = (b.data().notes ?? []) as Array<{ authorUid: string }>;
    const kept = notes.filter((n) => n.authorUid !== uid);
    if (kept.length !== notes.length) {
      removed += notes.length - kept.length;
      batch.update(b.ref, { notes: kept, [`confirmations.${uid}`]: deleteField(), updatedAt: Date.now() });
    }
  });
  if (removed) await batch.commit();
  return removed;
}

/**
 * Eject + block the reported user. A guest loses the slot; a host loses
 * the room, which passes to the guest (normally the person who reported).
 */
export async function ejectUser(code: string, uid: string): Promise<'guest' | 'host' | 'absent'> {
  const ref = doc(db(), 'rooms', code);
  const snap = await getDoc(ref);
  if (!snap.exists()) return 'absent';
  const { hostUid, guestUid } = snap.data();
  if (guestUid === uid) {
    await updateDoc(ref, { guestUid: null, blockedUids: arrayUnion(uid) });
    return 'guest';
  }
  if (hostUid === uid && guestUid) {
    await updateDoc(ref, { hostUid: guestUid, guestUid: null, blockedUids: arrayUnion(uid) });
    return 'host';
  }
  await updateDoc(ref, { blockedUids: arrayUnion(uid) });
  return 'absent';
}
