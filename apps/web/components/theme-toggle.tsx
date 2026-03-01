'use client';

import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { initTheme, setTheme, ThemeMode } from '@/lib/theme';
import { Button } from './ui/button';

export function ThemeToggle() {
  const [theme, setThemeState] = useState<ThemeMode>('light');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const initialTheme = initTheme();
    setThemeState(initialTheme);
    setReady(true);
  }, []);

  function toggleTheme() {
    const next: ThemeMode = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    setThemeState(next);
  }

  if (!ready) {
    return null;
  }

  return (
    <Button variant="outline" onClick={toggleTheme} className="gap-2">
      {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
      {theme === 'dark' ? 'Claro' : 'Escuro'}
    </Button>
  );
}
