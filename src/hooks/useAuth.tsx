import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { firebaseAuth, isFirebaseConfigured } from '@/services/firebase';

type AuthContextValue = {
  uid: string | null;
  ready: boolean;
  error: string | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [uid, setUid] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured || !firebaseAuth) {
      setReady(true);
      return;
    }
    const auth = firebaseAuth;
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUid(user.uid);
        setReady(true);
      } else {
        // No session yet — sign in anonymously. Firebase persists the resulting
        // UID via AsyncStorage (see firebase.ts), so subsequent launches skip
        // this step.
        try {
          await signInAnonymously(auth);
          // onAuthStateChanged will fire again with the new user
        } catch (e: any) {
          setError(e?.code || String(e));
          setReady(true);
        }
      }
    });
    return () => unsub();
  }, []);

  return (
    <AuthContext.Provider value={{ uid, ready, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
