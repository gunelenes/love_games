import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { firebaseFirestore } from './firebase';
import type { Category, PlaceCategory } from './types';

async function bumpMetaVersion() {
  if (!firebaseFirestore) return;
  await setDoc(
    doc(firebaseFirestore, 'meta', 'content'),
    { version: Date.now(), updatedAt: serverTimestamp() },
    { merge: true }
  );
}

export async function listDocs<T>(collectionName: string): Promise<T[]> {
  if (!firebaseFirestore) return [];
  const snap = await getDocs(collection(firebaseFirestore, collectionName));
  const items: any[] = [];
  snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
  return items.sort((a, b) => {
    const ao = typeof a.order === 'number' ? a.order : Number.MAX_SAFE_INTEGER;
    const bo = typeof b.order === 'number' ? b.order : Number.MAX_SAFE_INTEGER;
    if (ao !== bo) return ao - bo;
    return String(a.id).localeCompare(String(b.id));
  }) as T[];
}

export async function saveDoc<T extends { id: string }>(
  collectionName: string,
  item: T
) {
  if (!firebaseFirestore) throw new Error('Firestore not configured');
  const { id, ...rest } = item as any;
  await setDoc(doc(firebaseFirestore, collectionName, id), rest, {
    merge: true,
  });
  await bumpMetaVersion();
}

export async function removeDoc(collectionName: string, id: string) {
  if (!firebaseFirestore) throw new Error('Firestore not configured');
  await deleteDoc(doc(firebaseFirestore, collectionName, id));
  await bumpMetaVersion();
}

export async function reorderDocs(collectionName: string, ids: string[]) {
  if (!firebaseFirestore) return;
  await Promise.all(
    ids.map((id, index) =>
      updateDoc(doc(firebaseFirestore!, collectionName, id), { order: index })
    )
  );
  await bumpMetaVersion();
}

// Convenience typed wrappers
export const listCategories = () => listDocs<Category>('categories');
export const listPlaceCategories = () =>
  listDocs<PlaceCategory>('placeCategories');
export const listDiceFaces = () => listDocs<Category>('diceFaces');
