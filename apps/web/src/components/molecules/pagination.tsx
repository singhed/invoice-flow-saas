import * as React from "react";
import { cn } from "@/lib/utils";

export interface PaginationProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, pageCount, onPageChange }: PaginationProps) {
  const pages = React.useMemo(() => {
    return Array.from({ length: pageCount }, (_, i) => i + 1);
  }, [pageCount]);

  return (
    <nav aria-label="Pagination" className="flex items-center justify-between" role="navigation">
      <button
        type="button"
        className={cn("rounded-md border px-3 py-1.5 text-sm", page <= 1 && "pointer-events-none opacity-50")}
        onClick={() => onPageChange(page - 1)}
        aria-label="Previous page"
      >
        Previous
      </button>
      <ul className="flex items-center gap-1">
        {pages.map((p) => (
          <li key={p}>
            <button
              type="button"
              className={cn(
                "h-9 w-9 rounded-md border text-sm",
                p === page ? "bg-primary text-primary-foreground" : "bg-background"
              )}
              aria-current={p === page ? "page" : undefined}
              aria-label={`Page ${p}`}
              onClick={() => onPageChange(p)}
            >
              {p}
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className={cn(
          "rounded-md border px-3 py-1.5 text-sm",
          page >= pageCount && "pointer-events-none opacity-50"
        )}
        onClick={() => onPageChange(page + 1)}
        aria-label="Next page"
      >
        Next
      </button>
    </nav>
  );
}
