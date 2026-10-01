import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { firebaseAuth, isFirebaseConfigured } from '@/services/firebase';

type AuthContextValue = {
  uid: string | null;
  ready: boolean;
  error: string | null;
  /**
   * Yeniden anonim giriş dener. Başarılı olursa yeni UID döner, aksi halde null.
   * Firebase onAuthStateChanged genellikle zaten setUid'i tetikler; dönen değer
   * caller'ın hemen davranmasını kolaylaştırmak için.
   */
  retry: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [uid, setUid] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef<Promise<string | null> | null>(null);

  const attemptSignIn = useCallback(async (): Promise<string | null> => {
    if (!isFirebaseConfigured || !firebaseAuth) return null;
    if (inFlight.current) return inFlight.current;
    const p = (async () => {
      try {
        const cred = await signInAnonymously(firebaseAuth!);
        setError(null);
        return cred.user.uid;
      } catch (e: any) {
        const code = e?.code || e?.message || String(e);
        // eslint-disable-next-line no-console
        console.warn('[auth] anonymous sign-in failed:', code);
        setError(code);
        return null;
      } finally {
        inFlight.current = null;
      }
    })();
    inFlight.current = p;
    return p;
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured || !firebaseAuth) {
      setReady(true);
      return;
    }
    const auth = firebaseAuth;
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUid(user.uid);
        setError(null);
        setReady(true);
      } else {
        await attemptSignIn();
        // On success onAuthStateChanged will fire again with the new user.
        setReady(true);
      }
    });
    return () => unsub();
  }, [attemptSignIn]);

  const retry = useCallback(async (): Promise<string | null> => {
    const nextUid = await attemptSignIn();
    if (nextUid) setUid(nextUid);
    return nextUid;
  }, [attemptSignIn]);

  return (
    <AuthContext.Provider value={{ uid, ready, error, retry }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
