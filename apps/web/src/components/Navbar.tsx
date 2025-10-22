"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui";
import { env } from "@/env";
import { ThemeToggle } from "./theme-toggle";
import { createTranslator } from "@/i18n";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { cn } from "@/lib/utils";
import { User, LogOut, Settings, FileText } from "lucide-react";

export function Navbar() {
  const appName = env.NEXT_PUBLIC_APP_NAME;
  const [locale, setLocale] = useState<"en" | "es" | "zh">("en");
  const t = createTranslator(locale);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check auth state from localStorage
    if (typeof window !== "undefined") {
      const token = window.localStorage.getItem("auth_token");
      setIsAuthenticated(!!token);
      
      // Get locale from cookie
      const cookies = document.cookie.split(";").reduce<Record<string, string>>((acc, cookie) => {
        const [key, value] = cookie.trim().split("=");
        if (key && value) {
          acc[key] = value;
        }
        return acc;
      }, {});
      const cookieLocale = cookies.locale;
      if (cookieLocale === "en" || cookieLocale === "es" || cookieLocale === "zh") {
        setLocale(cookieLocale);
      }
    }
  }, []);

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("auth_token");
      window.location.href = "/";
    }
  };

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
          <div className="hidden items-center gap-1 lg:flex">
            {/* Primary Navigation */}
            <div className="flex items-center gap-1 mr-4 border-r border-border pr-4">
              <NavLink href="/">{t("navbar.home")}</NavLink>
              {isAuthenticated && (
                <NavLink href="/invoices">
                  <FileText className="mr-1.5 h-4 w-4" />
                  {t("navbar.invoices")}
                </NavLink>
              )}
              <a
                className="flex items-center rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                href="https://nextjs.org/docs"
                target="_blank"
                rel="noreferrer noopener"
              >
                {t("navbar.docs")}
              </a>
            </div>
            
            {/* Secondary Actions */}
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <LanguageSwitcher />
              
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring"
                    aria-label="User menu"
                    aria-expanded={userMenuOpen}
                  >
                    <User className="h-4 w-4" />
                    <span className="hidden md:inline">Account</span>
                  </button>
                  
                  {userMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setUserMenuOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-48 z-50 rounded-md border border-border bg-popover shadow-lg">
                        <div className="p-1">
                          <Link
                            href="/profile"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2 rounded-sm px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                          >
                            <Settings className="h-4 w-4" />
                            Profile Settings
                          </Link>
                          <button
                            onClick={handleLogout}
                            className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                          >
                            <LogOut className="h-4 w-4" />
                            Sign Out
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/auth/login">
                    <Button size="sm" variant="ghost">Sign in</Button>
                  </Link>
                  <Link href="/auth/register">
                    <Button size="sm" variant="primary">Get started</Button>
                  </Link>
                </div>
              )}
            </div>
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
            mobileMenuOpen ? "max-h-[32rem] pb-4" : "max-h-0"
          )}
        >
          <div className="space-y-1 pt-2">
            <div className="mb-2 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Navigation
            </div>
            <MobileNavLink href="/" onClick={() => setMobileMenuOpen(false)}>
              {t("navbar.home")}
            </MobileNavLink>
            {isAuthenticated && (
              <MobileNavLink href="/invoices" onClick={() => setMobileMenuOpen(false)}>
                <FileText className="mr-2 h-4 w-4" />
                {t("navbar.invoices")}
              </MobileNavLink>
            )}
            <MobileNavLink
              href="https://nextjs.org/docs"
              onClick={() => setMobileMenuOpen(false)}
              external
            >
              {t("navbar.docs")}
            </MobileNavLink>
            
            <div className="border-t border-border my-2 pt-2">
              <div className="mb-2 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Account
              </div>
              {isAuthenticated ? (
                <>
                  <MobileNavLink href="/profile" onClick={() => setMobileMenuOpen(false)}>
                    <Settings className="mr-2 h-4 w-4" />
                    Profile Settings
                  </MobileNavLink>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="flex w-full items-center rounded-md px-3 py-2 text-base text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <MobileNavLink href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                    Sign in
                  </MobileNavLink>
                  <MobileNavLink href="/auth/register" onClick={() => setMobileMenuOpen(false)}>
                    <span className="font-medium">Get started</span>
                  </MobileNavLink>
                </>
              )}
            </div>

            <div className="border-t border-border pt-2">
              <div className="mb-2 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Preferences
              </div>
              <div className="px-3 py-2">
                <LanguageSwitcher />
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
    >
      {children}
    </Link>
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
