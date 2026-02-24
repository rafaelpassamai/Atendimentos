import { cookies } from 'next/headers';
import { ReactNode } from 'react';
import { Toaster } from 'sonner';
import { AppShell } from '@/components/app-shell';
import { AppProviders } from '@/components/providers';
import './globals.css';

export const metadata = {
  title: 'Helpdesk MVP',
  description: 'Internal Helpdesk and Ticketing',
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const token = (await cookies()).get('sb-access-token')?.value;

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('helpdesk-theme');
                  var isDark = saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (isDark) document.documentElement.classList.add('dark');
                  document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
                } catch (e) {}
              })();
            `,
          }}
        />
        <AppProviders>
          {token ? <AppShell>{children}</AppShell> : children}
          <Toaster richColors closeButton />
        </AppProviders>
      </body>
    </html>
  );
}
