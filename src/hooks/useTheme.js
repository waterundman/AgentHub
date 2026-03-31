import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "agenthub_theme_v1";
const THEMES = {
  light: {
    "--color-background-primary": "#ffffff",
    "--color-background-secondary": "#f5f5f7",
    "--color-background-info": "#EEEDFE",
    "--color-text-primary": "#1a1a2e",
    "--color-text-secondary": "#4a4a5a",
    "--color-text-tertiary": "#8a8a9a",
    "--color-text-danger": "#E24B4A",
    "--color-border-primary": "#e0e0e0",
    "--color-border-secondary": "#d0d0d5",
    "--color-border-tertiary": "#c0c0c8",
    "--color-border-danger": "#E24B4A",
    "--color-border-info": "#7F77DD",
    "--border-radius-md": "8px",
    "--border-radius-lg": "12px",
    "--font-sans": "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    "--font-mono": "'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
  },
  dark: {
    "--color-background-primary": "#1a1a2e",
    "--color-background-secondary": "#16213e",
    "--color-background-info": "#2a2a4e",
    "--color-text-primary": "#e0e0e0",
    "--color-text-secondary": "#a0a0b0",
    "--color-text-tertiary": "#6a6a7a",
    "--color-text-danger": "#E24B4A",
    "--color-border-primary": "#2a2a3e",
    "--color-border-secondary": "#252538",
    "--color-border-tertiary": "#202030",
    "--color-border-danger": "#E24B4A",
    "--color-border-info": "#7F77DD",
    "--border-radius-md": "8px",
    "--border-radius-lg": "12px",
    "--font-sans": "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    "--font-mono": "'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
  },
};

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || "light";
    } catch {
      return "light";
    }
  });

  const applyTheme = useCallback((t) => {
    const vars = THEMES[t] || THEMES.light;
    const root = document.documentElement;
    for (const [key, value] of Object.entries(vars)) {
      root.style.setProperty(key, value);
    }
  }, []);

  useEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {}
  }, [theme, applyTheme]);

  const toggleTheme = useCallback(() => {
    setTheme(p => p === "light" ? "dark" : "light");
  }, []);

  return { theme, toggleTheme, isDark: theme === "dark" };
}
