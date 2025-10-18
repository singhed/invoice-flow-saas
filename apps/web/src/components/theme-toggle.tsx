"use client";

import { useTheme } from "@/providers/theme-provider";

export function ThemeToggle() {
  const { theme, system, toggleTheme, setTheme } = useTheme();
  const effective = theme === "system" ? system : theme;

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label="Toggle theme"
        className="inline-flex h-9 items-center rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={toggleTheme}
      >
        {effective === "dark" ? "Dark" : "Light"}
      </button>
      <select
        aria-label="Select theme"
        className="h-9 rounded-md border border-border bg-background px-2 text-sm"
        value={theme}
        onChange={(e) => setTheme(e.target.value as any)}
      >
        <option value="light">Light</option>
        <option value="dark">Dark</option>
        <option value="system">System</option>
      </select>
    </div>
  );
}
