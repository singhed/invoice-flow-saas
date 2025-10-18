import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface Crumb {
  label: string;
  href?: string;
}

export interface BreadcrumbsProps {
  items: Crumb[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm">
      <ol className="flex items-center gap-2 text-muted-foreground">
        {items.map((item, idx) => (
          <li key={item.label} className="flex items-center gap-2">
            {idx > 0 && <span aria-hidden="true">/</span>}
            {item.href ? (
              <Link href={item.href} className={cn("hover:text-foreground")}>{item.label}</Link>
            ) : (
              <span aria-current="page" className="text-foreground">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
