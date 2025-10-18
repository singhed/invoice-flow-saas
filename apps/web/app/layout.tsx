import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Navbar } from "@/components/Navbar";
import { env } from "@/env";
import { ThemeProvider } from "@/providers/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: env.NEXT_PUBLIC_APP_NAME,
  description: "Expense Management System with AI-powered categorization",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const apiOrigin = (() => {
    try {
      return new URL(env.NEXT_PUBLIC_API_URL).origin;
    } catch {
      return env.NEXT_PUBLIC_API_URL;
    }
  })();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="dns-prefetch" href={apiOrigin} />
        <link rel="preconnect" href={apiOrigin} crossOrigin="" />
      </head>
      <body>
        <ThemeProvider defaultTheme="system">
          <div className="min-h-screen bg-background text-foreground">
            <Navbar />
            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
