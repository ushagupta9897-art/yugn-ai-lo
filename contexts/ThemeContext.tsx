import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      // If user has a saved preference, use it
      if (savedTheme === 'dark' || savedTheme === 'light') {
        return savedTheme;
      }
      // Check for OS preference, but default to light for a professional B2B look
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return 'light';
    }
    return 'light'; // Default for SSR or non-browser environments
  });

  // This effect applies the theme to the DOM whenever the `theme` state changes.
  useEffect(() => {
    const root = window.document.documentElement;
    const isDark = theme === 'dark';
    
    root.classList.remove(isDark ? 'light' : 'dark');
    root.classList.add(theme);

    // Use the new main background colors from the design system
    if (isDark) {
      document.body.classList.add('bg-dark');
      document.body.classList.remove('bg-light');
    } else {
      document.body.classList.add('bg-light');
      document.body.classList.remove('bg-dark');
    }
  }, [theme]);

  // This effect listens for changes in the OS theme preference.
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      // Only update the theme if the user hasn't explicitly chosen one.
      // The presence of a 'theme' item in localStorage indicates an explicit choice.
      if (!localStorage.getItem('theme')) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    
    // Cleanup the listener when the component unmounts.
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []); // The empty dependency array ensures this effect runs only once on mount.


  // This function is called when the user clicks the theme toggle button.
  // It represents an explicit user choice.
  const toggleTheme = () => {
    setTheme((prevTheme) => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      // Save the user's explicit choice to localStorage.
      localStorage.setItem('theme', newTheme);
      return newTheme;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};