import { DICTIONARIES, DEFAULT_LOCALE, SUPPORTED_LOCALES, getMessage, format, type Locale, type Messages } from "./dictionaries";

export type { Locale, Messages };

function languageLabel(code: Locale): string {
  const label = (DICTIONARIES[code] as any)?.language?.[code];
  return typeof label === "string" ? label : code;
}

export const LANGUAGES: Array<{ code: Locale; label: string }> = [
  { code: "en", label: languageLabel("en") },
  { code: "es", label: languageLabel("es") },
  { code: "zh", label: languageLabel("zh") },
];

export function createTranslator(locale: Locale) {
  const dict = DICTIONARIES[locale] ?? DICTIONARIES[DEFAULT_LOCALE];
  const fallback = DICTIONARIES[DEFAULT_LOCALE];
  return function t(path: string, vars?: Record<string, string | number>): string {
    const msg = getMessage(dict, path) ?? getMessage(fallback, path) ?? path;
    return format(msg, vars);
  };
}

export function isSupportedLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as string[]).includes(value);
}
