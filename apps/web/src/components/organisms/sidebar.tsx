"use client";
import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { IconButton } from "@/components/atoms/icon-button";

export interface SidebarItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

export interface SidebarProps {
  items: SidebarItem[];
}

export function Sidebar({ items }: SidebarProps) {
  const [open, setOpen] = React.useState(true);

  return (
    <aside
      className={cn(
        "group relative h-full border-r border-border bg-background transition-[width] duration-200",
        open ? "w-56" : "w-14"
      )}
      aria-label="Sidebar"
    >
      <div className="flex h-12 items-center justify-between px-2">
        <span className={cn("text-sm font-semibold", !open && "sr-only")}>Menu</span>
        <IconButton aria-label={open ? "Collapse sidebar" : "Expand sidebar"} variant="ghost" onClick={() => setOpen((v) => !v)}>
          {open ? "⟨" : "⟩"}
        </IconButton>
      </div>
      <nav className="mt-2">
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  !open && "justify-center"
                )}
              >
                {item.icon}
                <span className={cn(!open && "sr-only")}>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
