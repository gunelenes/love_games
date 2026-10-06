'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useAuth } from '@/lib/auth-context';

const NAV = [
  { href: '/categories', label: '🎯 Categories' },
  { href: '/place-categories', label: '📍 Places' },
  { href: '/dice-faces', label: '🎲 Dice Faces' },
  { href: '/poses', label: '❦ Pozlar' },
  { href: '/suggestions', label: '💡 Öneriler' },
  { href: '/fantasies', label: '🌹 Fanteziler' },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAdmin, loading, signOut } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace('/login');
    else if (!isAdmin) router.replace('/no-access');
  }, [user, isAdmin, loading, router]);

  if (loading || !user || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted">
        Yükleniyor…
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-56 border-r border-white/10 p-4 flex flex-col">
        <div className="text-white font-extrabold text-lg mb-6">
          love_games
          <div className="text-xs font-normal text-muted">admin</div>
        </div>
        <nav className="space-y-1 flex-1">
          {NAV.map((n) => {
            const active = pathname?.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={
                  'block px-3 py-2 rounded-md text-sm ' +
                  (active
                    ? 'bg-accent/20 text-white border border-accent/40'
                    : 'text-muted hover:bg-white/5 hover:text-white')
                }
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="pt-4 border-t border-white/10 text-xs text-muted space-y-2">
          <div className="truncate">{user.email}</div>
          <button onClick={signOut} className="btn-ghost w-full text-xs">
            Çıkış
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
