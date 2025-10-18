import Link from "next/link";
import { env } from "@/env";
import { ThemeToggle } from "./theme-toggle";

export function Navbar() {
  const appName = env.NEXT_PUBLIC_APP_NAME;

  return (
    <nav className="border-b border-border bg-background/60 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-primary">
              {appName}
            </Link>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/" className="text-muted-foreground transition-colors hover:text-primary">
              Home
            </Link>
            <Link href="/invoices" className="text-muted-foreground transition-colors hover:text-primary">
              Invoices
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
}
