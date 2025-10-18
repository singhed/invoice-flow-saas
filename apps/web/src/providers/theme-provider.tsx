"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Theme = "light" | "dark" | "system";

type ThemeContextValue = {
  theme: Theme;
  system: "light" | "dark";
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyThemeClass(next: "light" | "dark") {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const isDark = next === "dark";
  root.classList.toggle("dark", isDark);
}

export interface ThemeProviderProps {
  defaultTheme?: Theme;
  storageKey?: string;
  children: React.ReactNode;
}

export function ThemeProvider({
  defaultTheme = "system",
  storageKey = "theme",
  children,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [system, setSystem] = useState<"light" | "dark">(getSystemTheme());

  // Initialize from localStorage and system preference
  useEffect(() => {
    const stored = typeof window !== "undefined" ? (localStorage.getItem(storageKey) as Theme | null) : null;
    const initialTheme: Theme = stored ?? defaultTheme;
    setThemeState(initialTheme);

    const effective = initialTheme === "system" ? getSystemTheme() : initialTheme;
    applyThemeClass(effective);

    // System preference listener
    const mql = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
    const onSystemChange = () => {
      const next = getSystemTheme();
      setSystem(next);
      const current = (localStorage.getItem(storageKey) as Theme | null) ?? defaultTheme;
      if (current === "system") {
        applyThemeClass(next);
      }
    };
    mql?.addEventListener?.("change", onSystemChange);

    // Cross-tab sync
    const onStorage = (e: StorageEvent) => {
      if (e.key !== storageKey) return;
      const value = (e.newValue as Theme | null) ?? defaultTheme;
      setThemeState(value);
      const effectiveTheme = value === "system" ? getSystemTheme() : value;
      applyThemeClass(effectiveTheme);
    };
    window.addEventListener("storage", onStorage);

    return () => {
      mql?.removeEventListener?.("change", onSystemChange);
      window.removeEventListener("storage", onStorage);
    };
  }, [defaultTheme, storageKey]);

  const setTheme = (value: Theme) => {
    setThemeState(value);
    if (value === "system") {
      localStorage.setItem(storageKey, "system");
      applyThemeClass(getSystemTheme());
      return;
    }
    localStorage.setItem(storageKey, value);
    applyThemeClass(value);
  };

  const toggleTheme = () => {
    const effective = theme === "system" ? system : theme;
    setTheme(effective === "dark" ? "light" : "dark");
  };

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, system, setTheme, toggleTheme }),
    [theme, system]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
