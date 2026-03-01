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
  { href: '/dashboard', label: 'Painel' },
  { href: '/tickets', label: 'Chamados' },
  { href: '/tickets/new', label: 'Novo Chamado' },
  { href: '/profile', label: 'Perfil' },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const meQuery = useMe();

  const navItems = meQuery.data?.user_type === 'admin' ? [...baseNav, { href: '/catalogs', label: 'Catalogos' }] : baseNav;

  async function signOut() {
    await supabase.auth.signOut();
    clearAccessTokenCookie();
    router.push('/login');
  }

  return (
    <div className="min-h-screen md:grid md:grid-cols-[280px_1fr]">
      <aside className="border-r border-border/80 bg-card/85 p-6 backdrop-blur">
        <div className="mb-6 rounded-xl border border-border/80 bg-muted/40 p-4">
          <h1 className="mb-1 text-xl font-bold tracking-tight">Helpdesk</h1>
          <p className="text-xs text-muted-foreground">{meQuery.data?.full_name ?? meQuery.data?.email ?? 'Carregando...'}</p>
        </div>
        <nav className="space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${pathname === item.href ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-muted'}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div>
        <header className="flex items-center justify-between border-b border-border/80 bg-card/70 px-8 py-4 backdrop-blur">
          <p className="text-sm text-muted-foreground">Console interno de suporte</p>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" onClick={signOut}>
              Sair
            </Button>
          </div>
        </header>
        <main className="p-6 md:p-8 lg:p-10">{children}</main>
      </div>
    </div>
  );
}
