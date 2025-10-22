import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Navbar } from "@/components/Navbar";
import { env } from "@/env";
import { ThemeProvider } from "@/providers/theme-provider";
import { ToastProvider } from "@/providers/toast-provider";
import { getCurrentLocale } from "@/i18n/server";
import "./globals.css";

export const metadata: Metadata = {
  title: env.NEXT_PUBLIC_APP_NAME,
  description: "Expense Management System with AI-powered categorization",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const locale = getCurrentLocale();
  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        <ThemeProvider defaultTheme="system">
          <ToastProvider>
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              Skip to main content
            </a>
            <div className="min-h-screen bg-background text-foreground">
              <Navbar />
              <main id="main-content" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {children}
              </main>
            </div>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
