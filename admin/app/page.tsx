'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function IndexPage() {
  const router = useRouter();
  const { user, isAdmin, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace('/login');
    else if (!isAdmin) router.replace('/no-access');
    else router.replace('/categories');
  }, [user, isAdmin, loading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center text-muted">
      Yükleniyor…
    </div>
  );
}
