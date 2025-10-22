"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui";
import { env } from "@/env";
import { ThemeToggle } from "./theme-toggle";
import { createTranslator } from "@/i18n";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { cn } from "@/lib/utils";

export function Navbar() {
  const appName = env.NEXT_PUBLIC_APP_NAME;
  const [locale, setLocale] = useState("en");
  const t = createTranslator(locale);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check auth state from localStorage
    if (typeof window !== "undefined") {
      const token = window.localStorage.getItem("auth_token");
      setIsAuthenticated(!!token);
      
      // Get locale from cookie
      const cookies = document.cookie.split(";").reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split("=");
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);
      setLocale(cookies.locale || "en");
    }
  }, []);

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  return (
    <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
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

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-6 lg:flex">
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
              className="text-sm text-muted-foreground transition-colors hover:text-primary"
              href="https://nextjs.org/docs"
              target="_blank"
              rel="noreferrer noopener"
            >
              {t("navbar.docs")}
            </a>
            
            {isAuthenticated ? (
              <Link href="/profile" className="text-sm text-muted-foreground transition-colors hover:text-primary">
                Profile
              </Link>
            ) : (
              <>
                <Link href="/auth/login" className="text-sm text-muted-foreground transition-colors hover:text-primary">
                  Sign in
                </Link>
                <Link href="/auth/register">
                  <Button size="sm" variant="primary">Create account</Button>
                </Link>
              </>
            )}
            
            <LanguageSwitcher />
            <ThemeToggle />
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center gap-3 lg:hidden">
            <ThemeToggle />
            <button
              onClick={toggleMobileMenu}
              className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div
          className={cn(
            "overflow-hidden transition-all duration-300 ease-in-out lg:hidden",
            mobileMenuOpen ? "max-h-96 pb-4" : "max-h-0"
          )}
        >
          <div className="space-y-1 pt-2">
            <MobileNavLink href="/" onClick={() => setMobileMenuOpen(false)}>
              {t("navbar.home")}
            </MobileNavLink>
            <MobileNavLink href="/invoices" onClick={() => setMobileMenuOpen(false)}>
              {t("navbar.invoices")}
            </MobileNavLink>
            <MobileNavLink
              href="https://nextjs.org/docs"
              onClick={() => setMobileMenuOpen(false)}
              external
            >
              {t("navbar.docs")}
            </MobileNavLink>
            
            <div className="border-t border-border my-2 pt-2">
              {isAuthenticated ? (
                <MobileNavLink href="/profile" onClick={() => setMobileMenuOpen(false)}>
                  Profile
                </MobileNavLink>
              ) : (
                <>
                  <MobileNavLink href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                    Sign in
                  </MobileNavLink>
                  <MobileNavLink href="/auth/register" onClick={() => setMobileMenuOpen(false)}>
                    Create account
                  </MobileNavLink>
                </>
              )}
            </div>

            <div className="pt-2">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

function MobileNavLink({
  href,
  children,
  onClick,
  external = false,
}: {
  href: string;
  children: React.ReactNode;
  onClick: () => void;
  external?: boolean;
}) {
  const className = "block rounded-md px-3 py-2 text-base text-muted-foreground transition-colors hover:bg-accent hover:text-foreground";
  
  if (external) {
    return (
      <a href={href} className={className} onClick={onClick} target="_blank" rel="noreferrer noopener">
        {children}
      </a>
    );
  }
  
  return (
    <Link href={href} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}
