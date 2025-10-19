"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LANGUAGES, type Locale, isSupportedLocale } from "@/i18n";

function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith(name + "="))
    ?.split("=")[1];
}

function setCookie(name: string, value: string, days = 365) {
  if (typeof document === "undefined") return;
  const maxAge = days * 24 * 60 * 60; // seconds
  document.cookie = `${name}=${value}; path=/; max-age=${maxAge}`;
}

export function LanguageSwitcher() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState<Locale>("en");

  useEffect(() => {
    const cookie = getCookie("locale");
    if (cookie && isSupportedLocale(cookie)) {
      setValue(cookie);
    }
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value;
    if (!isSupportedLocale(next)) return;
    setCookie("locale", next);
    setValue(next);
    startTransition(() => router.refresh());
  };

  return (
    <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
      <span className="hidden md:inline">🌐</span>
      <select
        className="rounded-md border border-border bg-transparent px-2 py-1 text-foreground"
        value={value}
        onChange={onChange}
        aria-label="Language"
        disabled={isPending}
      >
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code} className="bg-background text-foreground">
            {l.label}
          </option>
        ))}
      </select>
    </label>
  );
}
