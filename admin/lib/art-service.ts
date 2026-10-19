import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from 'firebase/storage';
import { firebaseFirestore, firebaseStorage } from './firebase';
import type { ArtCard, ArtDeck } from './types';

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

export async function listArt(deck: ArtDeck): Promise<ArtCard[]> {
  if (!firebaseFirestore) return [];
  const snap = await getDocs(collection(firebaseFirestore, deck));
  const items: ArtCard[] = [];
  snap.forEach((d) =>
    items.push({ id: d.id, ...(d.data() as Omit<ArtCard, 'id'>) })
  );
  return items.sort((a, b) => {
    const ao = typeof a.order === 'number' ? a.order : Number.MAX_SAFE_INTEGER;
    const bo = typeof b.order === 'number' ? b.order : Number.MAX_SAFE_INTEGER;
    if (ao !== bo) return ao - bo;
    return a.id.localeCompare(b.id);
  });
}

/**
 * Upload to Storage under /<deck>/<id>-<ts>.<ext>. Every upload gets a
 * fresh path, so mobile's disk cache (keyed by URL) never serves stale art.
 * Returns the download URL + the path (needed to delete the blob later).
 */
export async function uploadArtImage(
  deck: ArtDeck,
  id: string,
  file: File
): Promise<{ url: string; path: string }> {
  if (!firebaseStorage) throw new Error('Storage not configured');
  const extMatch = file.name.match(/\.([a-z0-9]+)$/i);
  const ext = extMatch ? extMatch[1].toLowerCase() : 'jpg';
  const path = `${deck}/${id}-${Date.now()}.${ext}`;
  const storageRef = ref(firebaseStorage, path);
  await uploadBytes(storageRef, file, {
    contentType: file.type,
    cacheControl: 'public, max-age=31536000, immutable',
  });
  const url = await getDownloadURL(storageRef);
  return { url, path };
}

export async function deleteArtImage(path: string | undefined) {
  if (!firebaseStorage || !path) return;
  try {
    await deleteObject(ref(firebaseStorage, path));
  } catch (e) {
    // Blob may already be gone — don't block the doc write/delete.
    // eslint-disable-next-line no-console
    console.warn('[art-service] deleteObject failed:', e);
  }
}

/**
 * Save the card. `previousImagePath` is the blob the doc pointed at before
 * this edit; if the image was replaced it gets deleted after the write.
 */
export async function saveArt(
  deck: ArtDeck,
  card: ArtCard,
  previousImagePath?: string
) {
  if (!firebaseFirestore) throw new Error('Firestore not configured');
  const { id, ...rest } = card;
  const payload = stripUndefined({
    ...rest,
    name: rest.name.trim(),
    nameI18n: cleanMap(rest.nameI18n),
    descriptionI18n: cleanMap(rest.descriptionI18n),
    description: rest.description?.trim() || undefined,
  });
  // No merge: cleared translations / description must actually disappear.
  await setDoc(doc(firebaseFirestore, deck, id), payload);
  if (previousImagePath && previousImagePath !== card.imagePath) {
    await deleteArtImage(previousImagePath);
  }
  await bumpMetaVersion();
}

export async function removeArt(deck: ArtDeck, card: ArtCard) {
  if (!firebaseFirestore) throw new Error('Firestore not configured');
  await deleteDoc(doc(firebaseFirestore, deck, card.id));
  await deleteArtImage(card.imagePath);
  await bumpMetaVersion();
}
