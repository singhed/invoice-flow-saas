import { cookies } from "next/headers";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type Locale } from "./dictionaries";

export function getCurrentLocale(): Locale {
  const c = cookies();
  const fromCookie = c.get("locale")?.value as Locale | undefined;
  if (fromCookie && SUPPORTED_LOCALES.includes(fromCookie)) return fromCookie;
  return DEFAULT_LOCALE;
}
