import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'ageGate:accepted:v1';

type AgeGateContextValue = {
  accepted: boolean;
  ready: boolean;
  accept: () => Promise<void>;
};

const AgeGateContext = createContext<AgeGateContextValue | null>(null);

export function AgeGateProvider({ children }: { children: ReactNode }) {
  const [accepted, setAccepted] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (cancelled) return;
        setAccepted(raw === 'true');
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const accept = useCallback(async () => {
    setAccepted(true);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // ignore write failure
    }
  }, []);

  return (
    <AgeGateContext.Provider value={{ accepted, ready, accept }}>
      {children}
    </AgeGateContext.Provider>
  );
}

export function useAgeGate() {
  const ctx = useContext(AgeGateContext);
  if (!ctx) throw new Error('useAgeGate must be used inside <AgeGateProvider>');
  return ctx;
}
