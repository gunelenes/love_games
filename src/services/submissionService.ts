import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { firebaseAuth, firebaseFirestore } from './firebase';
import i18n from '@/i18n';

export type SubmissionKind = 'suggestions' | 'fantasies';

const MAX_LEN = 1000;
const MIN_LEN = 4;

export async function submitFeedback(
  kind: SubmissionKind,
  text: string
): Promise<void> {
  if (!firebaseFirestore) {
    throw new Error('Firebase not configured');
  }
  const uid = firebaseAuth?.currentUser?.uid;
  if (!uid) {
    throw new Error('Not signed in');
  }
  const trimmed = text.trim();
  if (trimmed.length < MIN_LEN) {
    throw new Error('too-short');
  }
  if (trimmed.length > MAX_LEN) {
    throw new Error('too-long');
  }
  await addDoc(collection(firebaseFirestore, kind), {
    text: trimmed,
    uid,
    locale: i18n.language || 'en',
    status: 'new',
    createdAt: serverTimestamp(),
  });
}

export const SUBMISSION_LIMITS = { min: MIN_LEN, max: MAX_LEN };
