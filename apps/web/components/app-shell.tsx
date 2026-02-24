'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode } from 'react';
import { useMe } from '@/hooks/use-me';
import { clearAccessTokenCookie } from '@/lib/auth-cookie';
import { supabase } from '@/lib/supabase';
import { ThemeToggle } from './theme-toggle';
import { Button } from './ui/button';

const baseNav = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/tickets', label: 'Tickets' },
  { href: '/tickets/new', label: 'New Ticket' },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const meQuery = useMe();

  const navItems = meQuery.data?.user_type === 'admin' ? [...baseNav, { href: '/catalogs', label: 'Catalogs' }] : baseNav;

  async function signOut() {
    await supabase.auth.signOut();
    clearAccessTokenCookie();
    router.push('/login');
  }

  return (
    <div className="min-h-screen md:grid md:grid-cols-[250px_1fr]">
      <aside className="border-r border-border bg-card/80 p-5 backdrop-blur-sm">
        <h1 className="mb-1 text-xl font-bold">Helpdesk</h1>
        <p className="mb-6 text-xs text-muted-foreground">{meQuery.data?.full_name ?? meQuery.data?.email ?? 'Loading...'}</p>
        <nav className="space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-md px-3 py-2 text-sm ${pathname === item.href ? 'bg-secondary font-semibold' : 'hover:bg-muted'}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div>
        <header className="flex items-center justify-between border-b border-border bg-card/70 px-6 py-4 backdrop-blur-sm">
          <p className="text-sm text-muted-foreground">Internal support console</p>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" onClick={signOut}>
              Sign out
            </Button>
          </div>
        </header>
        <main className="p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
