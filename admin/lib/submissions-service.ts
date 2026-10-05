import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore';
import { firebaseFirestore } from './firebase';
import type { Submission, SubmissionStatus } from './types';

export type SubmissionCollection = 'suggestions' | 'fantasies';

export async function listSubmissions(
  name: SubmissionCollection
): Promise<Submission[]> {
  if (!firebaseFirestore) return [];
  const q = query(
    collection(firebaseFirestore, name),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  const items: Submission[] = [];
  snap.forEach((d) => {
    const data = d.data() as Omit<Submission, 'id'>;
    items.push({ id: d.id, ...data, status: data.status || 'new' });
  });
  return items;
}

export async function updateSubmissionStatus(
  name: SubmissionCollection,
  id: string,
  status: SubmissionStatus
): Promise<void> {
  if (!firebaseFirestore) throw new Error('Firestore not configured');
  await updateDoc(doc(firebaseFirestore, name, id), { status });
}

export async function deleteSubmission(
  name: SubmissionCollection,
  id: string
): Promise<void> {
  if (!firebaseFirestore) throw new Error('Firestore not configured');
  await deleteDoc(doc(firebaseFirestore, name, id));
}
