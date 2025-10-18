import Link from "next/link";
import { env } from "@/env.mjs";

export function Navbar() {
  const appName = env.NEXT_PUBLIC_APP_NAME;

  return (
    <nav className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-sky-400 hover:text-sky-300">
              {appName}
            </Link>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/" className="text-slate-300 transition-colors hover:text-sky-400">
              Home
            </Link>
            <Link href="/invoices" className="text-slate-300 transition-colors hover:text-sky-400">
              Invoices
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
