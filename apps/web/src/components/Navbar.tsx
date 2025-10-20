import Link from "next/link";
import { Button } from "@/components/ui";
import { env } from "@/env";
import { ThemeToggle } from "./theme-toggle";
import { createTranslator } from "@/i18n";
import { getCurrentLocale } from "@/i18n/server";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function Navbar() {
  const appName = env.NEXT_PUBLIC_APP_NAME;
  const locale = getCurrentLocale();
  const t = createTranslator(locale);

  return (
    <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="group flex items-center gap-2">
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-sky-400 to-cyan-300 ring-2 ring-sky-400/30"
              />
              <span className="text-lg font-bold tracking-tight transition-colors group-hover:text-primary">
                {appName}
              </span>
              <span className="ml-2 hidden rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary ring-1 ring-primary/20 sm:inline">
                {t("navbar.beta")}
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/" className="text-sm text-muted-foreground transition-colors hover:text-primary">
              {t("navbar.home")}
            </Link>
            <Link
              href="/invoices"
              className="text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              {t("navbar.invoices")}
            </Link>
            <a
              className="hidden text-sm text-muted-foreground transition-colors hover:text-primary md:inline"
              href="https://nextjs.org/docs"
              target="_blank"
              rel="noreferrer noopener"
            >
              {t("navbar.docs")}
            </a>
            <Link href="/auth/login" className="text-sm text-muted-foreground transition-colors hover:text-primary">
              Sign in
            </Link>
            <div className="hidden md:block">
              <Link href="/auth/register" className="inline-flex">
                <Button size="sm" variant="primary">Create account</Button>
              </Link>
            </div>
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
}
