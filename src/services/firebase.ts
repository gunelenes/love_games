import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  type Auth,
  // getReactNativePersistence is exported from firebase/auth's RN bundle
  // (node_modules/@firebase/auth/dist/index.rn.d.ts) — TS default resolution
  // picks the web bundle so we bypass the type check here.
  // @ts-expect-error resolved at runtime by Metro to the RN bundle
  getReactNativePersistence,
} from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { firebaseConfig, isFirebaseConfigured } from './firebaseConfig';

let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;
let firebaseFirestore: Firestore | null = null;

if (isFirebaseConfigured) {
  try {
    firebaseApp = getApps().length
      ? getApps()[0]
      : initializeApp(firebaseConfig);

    // Persist auth state to AsyncStorage. initializeAuth throws if called
    // more than once on the same app — fall back to getAuth on hot reload.
    try {
      firebaseAuth = initializeAuth(firebaseApp, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
    } catch {
      firebaseAuth = getAuth(firebaseApp);
    }

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
