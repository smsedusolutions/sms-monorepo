import React, { createContext, useContext, useState, useEffect } from 'react';

export type LandingThemeMode = 'dark' | 'light';

interface LandingThemeContextType {
  mode: LandingThemeMode;
  isDark: boolean;
  toggleTheme: () => void;
  setMode: (mode: LandingThemeMode) => void;
}

const LandingThemeContext = createContext<LandingThemeContextType>({
  mode: 'dark',
  isDark: true,
  toggleTheme: () => {},
  setMode: () => {},
});

export const LandingThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<LandingThemeMode>(() => {
    try {
      const saved = localStorage.getItem('sms_landing_theme');
      if (saved === 'light' || saved === 'dark') {
        return saved;
      }
    } catch {
      // Ignore localStorage errors
    }
    return 'dark'; // Default to dark theme as requested
  });

  useEffect(() => {
    try {
      localStorage.setItem('sms_landing_theme', mode);
    } catch {
      // Ignore localStorage errors
    }
    document.documentElement.style.colorScheme = mode;
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  const toggleTheme = () => {
    setModeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setMode = (newMode: LandingThemeMode) => {
    setModeState(newMode);
  };

  return (
    <LandingThemeContext.Provider
      value={{
        mode,
        isDark: mode === 'dark',
        toggleTheme,
        setMode,
      }}
    >
      {children}
    </LandingThemeContext.Provider>
  );
};

export const useLandingTheme = (): LandingThemeContextType => {
  const context = useContext(LandingThemeContext);
  if (!context) {
    throw new Error('useLandingTheme must be used within a LandingThemeProvider');
  }
  return context;
};
