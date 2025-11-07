'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';
type ThemePreference = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  themePreference: ThemePreference;
  setTheme: (theme: ThemePreference) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'horizon-theme-preference';

function getSystemTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getStoredPreference(): ThemePreference {
  if (typeof window === 'undefined') return 'system';
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
  } catch (error) {
    console.warn('Failed to read theme preference from localStorage:', error);
  }
  return 'system';
}

function resolveTheme(preference: ThemePreference): Theme {
  if (preference === 'system') {
    return getSystemTheme();
  }
  return preference;
}

export function ThemeProvider({ 
  children,
  defaultTheme = 'system',
}: { 
  children: React.ReactNode;
  defaultTheme?: ThemePreference;
}) {
  const [themePreference, setThemePreference] = useState<ThemePreference>(defaultTheme);
  const [theme, setThemeState] = useState<Theme>(() => resolveTheme(defaultTheme));
  const [mounted, setMounted] = useState(false);

  // Initialize theme from localStorage on mount
  useEffect(() => {
    const storedPreference = getStoredPreference();
    setThemePreference(storedPreference);
    setThemeState(resolveTheme(storedPreference));
    setMounted(true);
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    if (themePreference !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setThemeState(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [themePreference]);

  // Apply theme to document root
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove('light', 'dark');
    
    // Add new theme class
    root.classList.add(theme);
    
    // Update meta theme-color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme === 'dark' ? '#0f1419' : '#ffffff');
    }
  }, [theme, mounted]);

  const setTheme = (preference: ThemePreference) => {
    setThemePreference(preference);
    const resolvedTheme = resolveTheme(preference);
    setThemeState(resolvedTheme);
    
    // Persist to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, preference);
    } catch (error) {
      console.warn('Failed to save theme preference to localStorage:', error);
    }
  };

  const toggleTheme = () => {
    // Toggle between light and dark (ignore system preference)
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  // Always provide context, even before mounting
  return (
    <ThemeContext.Provider value={{ theme, themePreference, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
