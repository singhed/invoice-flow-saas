"use client";

import React, { createContext, useContext, useMemo, useSyncExternalStore } from "react";

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
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
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

// A small external store per storage key to avoid useEffect in components
type ThemeState = { theme: Theme; system: "light" | "dark" };

type ThemeStore = {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => ThemeState;
  setTheme: (value: Theme) => void;
  toggle: () => void;
};

const stores = new Map<string, ThemeStore>();

function createThemeStore(storageKey: string, defaultTheme: Theme): ThemeStore {
  let system: "light" | "dark" = getSystemTheme();
  let theme: Theme = defaultTheme;

  if (typeof window !== "undefined") {
    const stored = (localStorage.getItem(storageKey) as Theme | null) ?? null;
    theme = stored ?? defaultTheme;
  }

  const listeners = new Set<() => void>();

  const effective = (): "light" | "dark" => (theme === "system" ? system : theme);

  // Apply initial theme on creation (client only)
  if (typeof window !== "undefined") {
    applyThemeClass(effective());
  }

  // System preference subscription (module-level; cleanup not strictly necessary for app root)
  if (typeof window !== "undefined" && window.matchMedia) {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystemChange = () => {
      system = getSystemTheme();
      if (theme === "system") {
        applyThemeClass(effective());
      }
      listeners.forEach((l) => l());
    };
    mql.addEventListener?.("change", onSystemChange);
  }

  // Cross-tab storage sync
  if (typeof window !== "undefined") {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== storageKey) return;
      const value = (e.newValue as Theme | null) ?? defaultTheme;
      theme = value;
      applyThemeClass(effective());
      listeners.forEach((l) => l());
    };
    window.addEventListener("storage", onStorage);
  }

  const store: ThemeStore = {
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot: () => ({ theme, system }),
    setTheme: (value: Theme) => {
      theme = value;
      if (typeof window !== "undefined") {
        localStorage.setItem(storageKey, value);
      }
      applyThemeClass(effective());
      listeners.forEach((l) => l());
    },
    toggle: () => {
      const eff = effective();
      store.setTheme(eff === "dark" ? "light" : "dark");
    },
  };

  return store;
}

function getStore(storageKey: string, defaultTheme: Theme) {
  const key = `${storageKey}::${defaultTheme}`; // scope by key and default to avoid collisions if needed
  let store = stores.get(key);
  if (!store) {
    store = createThemeStore(storageKey, defaultTheme);
    stores.set(key, store);
  }
  return store;
}

export function ThemeProvider({
  defaultTheme = "system",
  storageKey = "theme",
  children,
}: ThemeProviderProps) {
  const store = useMemo(() => getStore(storageKey, defaultTheme), [storageKey, defaultTheme]);
  const snapshot = useSyncExternalStore<ThemeState>(
    store.subscribe,
    store.getSnapshot,
    () => ({ theme: defaultTheme, system: "light" as const })
  );

  const setTheme = (value: Theme) => store.setTheme(value);
  const toggleTheme = () => store.toggle();

  const value = useMemo<ThemeContextValue>(
    () => ({ theme: snapshot.theme, system: snapshot.system, setTheme, toggleTheme }),
    [snapshot.theme, snapshot.system]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
