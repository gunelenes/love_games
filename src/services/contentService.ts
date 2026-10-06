import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
} from 'firebase/firestore';
import { firebaseFirestore } from './firebase';
import type { Category, PlaceCategory, Pose } from '@/types';

export type AllContent = {
  categories: Category[];
  placeCategories: PlaceCategory[];
  diceFaces: Category[];
  poses: Pose[];
  version: number | null;
};

function sortByOrder<T extends { id: string }>(
  arr: Array<T & { order?: number }>
): T[] {
  return [...arr].sort((a, b) => {
    const oa = typeof a.order === 'number' ? a.order : Number.MAX_SAFE_INTEGER;
    const ob = typeof b.order === 'number' ? b.order : Number.MAX_SAFE_INTEGER;
    if (oa !== ob) return oa - ob;
    return a.id.localeCompare(b.id);
  });
}

async function fetchCollection<T>(name: string): Promise<T[] | null> {
  if (!firebaseFirestore) return null;
  const q = query(collection(firebaseFirestore, name));
  const snap = await getDocs(q);
  const items: Array<T & { id: string; order?: number }> = [];
  snap.forEach((d) => {
    items.push({ id: d.id, ...(d.data() as T & { order?: number }) });
  });
  return sortByOrder(items) as T[];
}

/**
 * Variant that swallows failures (missing rules, offline, 403) and returns
 * an empty list instead of null. Use for collections whose absence should
 * not knock the rest of the content out — e.g. `poses` before its rules
 * ship, where a permission-denied here would otherwise reject Promise.all
 * and send mobile back to the bundle fallback.
 */
async function fetchCollectionSoft<T>(name: string): Promise<T[]> {
  try {
    const result = await fetchCollection<T>(name);
    return result ?? [];
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(`[contentService] soft-fetch failed for ${name}:`, err);
    return [];
  }
}

async function fetchMetaVersion(): Promise<number | null> {
  if (!firebaseFirestore) return null;
  try {
    const snap = await getDoc(doc(firebaseFirestore, 'meta', 'content'));
    if (!snap.exists()) return null;
    const data = snap.data();
    return typeof data.version === 'number' ? data.version : null;
  } catch {
    return null;
  }
}

/**
 * Firestore'dan tüm içeriği (categories + placeCategories + diceFaces) paralel çeker.
 * Firebase configure edilmemişse veya fetch başarısızsa null döner.
 */
export async function fetchAllContent(): Promise<AllContent | null> {
  if (!firebaseFirestore) return null;
  try {
    const [categories, placeCategories, diceFaces, poses, version] =
      await Promise.all([
        fetchCollection<Category>('categories'),
        fetchCollection<PlaceCategory>('placeCategories'),
        fetchCollection<Category>('diceFaces'),
        fetchCollectionSoft<Pose>('poses'),
        fetchMetaVersion(),
      ]);
    if (!categories || !placeCategories || !diceFaces) return null;
    return {
      categories,
      placeCategories,
      diceFaces,
      poses,
      version,
    };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[contentService] fetch failed, using cache/bundle:', err);
    return null;
  }
}
