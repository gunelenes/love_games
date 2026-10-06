import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from 'firebase/storage';
import { firebaseFirestore, firebaseStorage } from './firebase';
import type { Pose } from './types';

const COLLECTION = 'poses';

async function bumpMetaVersion() {
  if (!firebaseFirestore) return;
  await setDoc(
    doc(firebaseFirestore, 'meta', 'content'),
    { version: Date.now(), updatedAt: serverTimestamp() },
    { merge: true }
  );
}

/**
 * Trim i18n maps: drop empty strings, drop whole map if it's all blank.
 * Firestore rejects `undefined`, so we return undefined for cleanup instead
 * of writing empty structures the mobile fallback has to skip over.
 */
function cleanMap(
  map: Record<string, string> | undefined
): Record<string, string> | undefined {
  if (!map) return undefined;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(map)) {
    const trimmed = (v || '').trim();
    if (trimmed) out[k] = trimmed;
  }
  return Object.keys(out).length ? out : undefined;
}

function stripUndefined<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out as T;
}

export async function listPoses(): Promise<Pose[]> {
  if (!firebaseFirestore) return [];
  const snap = await getDocs(collection(firebaseFirestore, COLLECTION));
  const items: Pose[] = [];
  snap.forEach((d) => items.push({ id: d.id, ...(d.data() as Omit<Pose, 'id'>) }));
  return items.sort((a, b) => {
    const ao = typeof a.order === 'number' ? a.order : Number.MAX_SAFE_INTEGER;
    const bo = typeof b.order === 'number' ? b.order : Number.MAX_SAFE_INTEGER;
    if (ao !== bo) return ao - bo;
    return a.id.localeCompare(b.id);
  });
}

/**
 * Upload image blob to Storage under /poses/<id>-<ts>.<ext> and return
 * the public download URL + storage path so the Firestore doc can store
 * both (path is needed to delete the blob when the pose is removed).
 */
export async function uploadPoseImage(
  id: string,
  file: File
): Promise<{ url: string; path: string }> {
  if (!firebaseStorage) throw new Error('Storage not configured');
  const extMatch = file.name.match(/\.([a-z0-9]+)$/i);
  const ext = extMatch ? extMatch[1].toLowerCase() : 'jpg';
  const path = `poses/${id}-${Date.now()}.${ext}`;
  const storageRef = ref(firebaseStorage, path);
  await uploadBytes(storageRef, file, { contentType: file.type });
  const url = await getDownloadURL(storageRef);
  return { url, path };
}

export async function deletePoseImage(path: string | undefined) {
  if (!firebaseStorage || !path) return;
  try {
    await deleteObject(ref(firebaseStorage, path));
  } catch (e) {
    // Blob may already be gone — don't block pose doc delete.
    // eslint-disable-next-line no-console
    console.warn('[pose-service] deleteObject failed:', e);
  }
}

export async function savePose(pose: Pose) {
  if (!firebaseFirestore) throw new Error('Firestore not configured');
  const { id, ...rest } = pose;
  const payload = stripUndefined({
    ...rest,
    nameI18n: cleanMap(rest.nameI18n),
    descriptionI18n: cleanMap(rest.descriptionI18n),
    description: rest.description?.trim() || undefined,
  });
  await setDoc(doc(firebaseFirestore, COLLECTION, id), payload, { merge: true });
  await bumpMetaVersion();
}

export async function reorderPoses(ids: string[]) {
  if (!firebaseFirestore) return;
  await Promise.all(
    ids.map((id, index) =>
      updateDoc(doc(firebaseFirestore!, COLLECTION, id), { order: index })
    )
  );
  await bumpMetaVersion();
}

export async function removePose(id: string, imagePath?: string) {
  if (!firebaseFirestore) throw new Error('Firestore not configured');
  await deletePoseImage(imagePath);
  await deleteDoc(doc(firebaseFirestore, COLLECTION, id));
  await bumpMetaVersion();
}
