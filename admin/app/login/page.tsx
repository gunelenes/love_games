'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function LoginPage() {
  const router = useRouter();
  const { user, isAdmin, loading, error, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (user && isAdmin) router.replace('/categories');
    if (user && !isAdmin) router.replace('/no-access');
  }, [user, isAdmin, loading, router]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await signIn(email, password);
    } catch {
      // error surface via useAuth
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={submit} className="card w-full max-w-sm space-y-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Admin Girişi</h1>
          <p className="text-sm text-muted mt-1">
            love_games içerik yönetimi
          </p>
        </div>
        <div>
          <label className="label">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            autoComplete="email"
          />
        </div>
        <div>
          <label className="label">Şifre</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            autoComplete="current-password"
          />
        </div>
        {error ? (
          <p className="text-sm text-red-400">{error}</p>
        ) : null}
        <button
          type="submit"
          disabled={submitting}
          className="btn-primary w-full"
        >
          {submitting ? 'Giriş yapılıyor…' : 'Giriş yap'}
        </button>
        <p className="text-xs text-muted">
          İlk defa mı? Firebase Console → Authentication → Users'tan email +
          şifre oluştur, sonra{' '}
          <code className="bg-white/5 px-1 py-0.5 rounded">
            npm run grant-admin -- email
          </code>{' '}
          ile admin ol.
        </p>
      </form>
    </div>
  );
}
