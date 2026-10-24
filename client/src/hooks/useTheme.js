import { useCallback, useEffect, useState } from 'react';

const prefersDark = () => window.matchMedia?.('(prefers-color-scheme: dark)').matches;

export function useTheme() {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || (prefersDark() ? 'dark' : 'light'));

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem('ttl-theme', theme);
    } catch {
      /* storage blocked: theme still applies for this visit */
    }
  }, [theme]);

  const toggle = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), []);
  return { theme, toggle };
}
