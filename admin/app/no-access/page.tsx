'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { firebaseAuth } from '@/lib/firebase';

export default function NoAccessPage() {
  const { user, signOut } = useAuth();
  const [claims, setClaims] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const forceRefresh = async () => {
    if (!firebaseAuth?.currentUser) return;
    setRefreshing(true);
    try {
      // Get a brand-new token from the server, then read claims.
      await firebaseAuth.currentUser.getIdToken(true);
      const res = await firebaseAuth.currentUser.getIdTokenResult(true);
      setClaims(JSON.stringify(res.claims, null, 2));
      if (res.claims.admin === true) {
        // Hard reload so AuthProvider picks it up cleanly.
        window.location.href = '/categories';
      }
    } catch (e: any) {
      setClaims('Hata: ' + (e?.message || String(e)));
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 space-y-4">
      <div className="card max-w-md text-center space-y-3">
        <div className="text-4xl">🔒</div>
        <h1 className="text-xl font-bold text-white">Yetkin yok</h1>
        <p className="text-sm text-muted">
          Hesap açıldı ({user?.email}) ama admin custom claim henüz token'a
          yansımamış. Aşağıdaki butonla zorla token yenile.
        </p>
        <button
          onClick={forceRefresh}
          disabled={refreshing}
          className="btn-primary w-full"
        >
          {refreshing ? 'Yenileniyor…' : 'Token yenile & tekrar dene'}
        </button>
        {claims ? (
          <pre className="text-left text-xs bg-black/40 border border-white/10 rounded p-2 overflow-auto">
            {claims}
          </pre>
        ) : null}
        <button onClick={signOut} className="btn-ghost w-full">
          Çıkış yap
        </button>
      </div>
    </div>
  );
}
