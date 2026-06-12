'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (theme: Theme) => void;
} | null>(null);

export function Providers({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Grab cached theme or fall back to dark
    const savedTheme = (localStorage.getItem('nexus_theme') as Theme) || 'dark';
    setThemeState(savedTheme);

    // Apply class to HTML element safely on the client
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(savedTheme);
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('nexus_theme', newTheme);

    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(newTheme);
  };

  if (!mounted) return <>{children}</>;

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Custom hook to use theme seamlessly across the dashboard
export function useAppTheme() {
  const context = useContext(ThemeContext);
  if (!context)
    throw new Error('useAppTheme must be used inside a Providers layout.');
  return context;
}
