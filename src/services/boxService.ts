import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import { firebaseFirestore } from './firebase';
import type { BoxNote, RoomBox } from '@/types';

function genId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function requireDb() {
  if (!firebaseFirestore) throw new Error('Firestore hazır değil');
  return firebaseFirestore;
}

function boxesCol(roomCode: string) {
  return collection(requireDb(), 'rooms', roomCode, 'boxes');
}

function boxRef(roomCode: string, boxId: string) {
  return doc(requireDb(), 'rooms', roomCode, 'boxes', boxId);
}

// ---------- CRUD ----------

export async function createBox(
  roomCode: string,
  authorUid: string,
  name: string,
  color: string,
  icon: string
): Promise<string> {
  const id = genId();
  const now = Date.now();
  const doc: RoomBox = {
    id,
    name: name.trim() || 'Kutu',
    color,
    icon,
    createdAt: now,
    updatedAt: now,
    notes: [],
    confirmations: {},
    createdBy: authorUid,
  };
  await setDoc(boxRef(roomCode, id), doc);
  return id;
}

export async function deleteBox(roomCode: string, boxId: string) {
  await deleteDoc(boxRef(roomCode, boxId));
}

export async function renameBox(
  roomCode: string,
  boxId: string,
  name: string
) {
  const trimmed = name.trim();
  if (!trimmed) return;
  await updateDoc(boxRef(roomCode, boxId), {
    name: trimmed,
    updatedAt: Date.now(),
  });
}

export async function addNote(
  roomCode: string,
  boxId: string,
  authorUid: string,
  text: string,
  currentNotes: BoxNote[]
) {
  const trimmed = text.trim();
  if (!trimmed) return;
  const note: BoxNote = {
    id: genId(),
    text: trimmed,
    authorUid,
    createdAt: Date.now(),
  };
  // Reset your own confirmation when adding notes (so partner sees fresh state).
  await updateDoc(boxRef(roomCode, boxId), {
    notes: [...currentNotes, note],
    [`confirmations.${authorUid}`]: false,
    updatedAt: Date.now(),
  });
}

export async function deleteNote(
  roomCode: string,
  boxId: string,
  noteId: string,
  authorUid: string,
  currentNotes: BoxNote[]
) {
  await updateDoc(boxRef(roomCode, boxId), {
    notes: currentNotes.filter((n) => n.id !== noteId),
    [`confirmations.${authorUid}`]: false,
    updatedAt: Date.now(),
  });
}

export async function setConfirmation(
  roomCode: string,
  boxId: string,
  uid: string,
  confirmed: boolean
) {
  await updateDoc(boxRef(roomCode, boxId), {
    [`confirmations.${uid}`]: confirmed,
    updatedAt: Date.now(),
  });
}

// ---------- Subscriptions ----------

export function subscribeBoxes(
  roomCode: string,
  onData: (boxes: RoomBox[]) => void,
  onError?: (e: unknown) => void
): Unsubscribe {
  const q = query(boxesCol(roomCode), orderBy('updatedAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      const list: RoomBox[] = [];
      snap.forEach((d) => list.push(d.data() as RoomBox));
      onData(list);
    },
    onError
  );
}

export function subscribeBox(
  roomCode: string,
  boxId: string,
  onData: (box: RoomBox | null) => void,
  onError?: (e: unknown) => void
): Unsubscribe {
  return onSnapshot(
    boxRef(roomCode, boxId),
    (snap) => {
      onData(snap.exists() ? (snap.data() as RoomBox) : null);
    },
    onError
  );
}

// Silence unused import warning for serverTimestamp — reserved for future
// timestamp fields (e.g., last-modified server time).
void serverTimestamp;
