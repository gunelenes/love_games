import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { firebaseConfig, isFirebaseConfigured } from './firebaseConfig';

let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;
let firebaseFirestore: Firestore | null = null;

if (isFirebaseConfigured) {
  try {
    firebaseApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    firebaseAuth = getAuth(firebaseApp);
    firebaseFirestore = getFirestore(firebaseApp);
  } catch (err) {
    // Config invalid or init failed — leave everything null so bundle fallback works.
    // eslint-disable-next-line no-console
    console.warn('[firebase] init failed:', err);
    firebaseApp = null;
    firebaseAuth = null;
    firebaseFirestore = null;
  }
}

export { firebaseApp, firebaseAuth, firebaseFirestore, isFirebaseConfigured };
