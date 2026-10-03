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

/**
 * Firestore rejects writes containing `undefined`. Admin forms can leave
 * optional fields (nameEn, promptsEn, flavors, etc.) blank — strip them
 * before writing so the doc stays clean + Firestore accepts it.
 *
 * For arrays we keep empty-string entries intact (promptsEn uses index
 * alignment with tr prompts — an empty slot means "fall back to tr at
 * this index"), but drop the whole array when every entry is empty.
 */
function stripEmpty<T>(obj: T): T {
  if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      if (v === undefined) continue;
      if (typeof v === 'string' && v.trim() === '') continue;
      if (Array.isArray(v)) {
        if (v.length === 0) continue;
        if (
          v.every((x) => typeof x === 'string' && x.trim() === '')
        ) {
          continue;
        }
        out[k] = v.map((x) =>
          typeof x === 'object' && x ? stripEmpty(x) : x
        );
      } else if (typeof v === 'object') {
        out[k] = stripEmpty(v);
      } else {
        out[k] = v;
      }
    }
    return out as T;
  }
  return obj;
}

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
  const payload = stripEmpty(rest);
  await setDoc(doc(firebaseFirestore, collectionName, id), payload, {
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
