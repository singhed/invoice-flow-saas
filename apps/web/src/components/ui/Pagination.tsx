"use client";

import { Button } from "./Button";
import { cn } from "@/lib/utils";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage?: number;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  onItemsPerPageChange,
  className,
}: PaginationProps) {
  const pages = [];
  const maxPagesToShow = 5;

  let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
  let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

  if (endPage - startPage < maxPagesToShow - 1) {
    startPage = Math.max(1, endPage - maxPagesToShow + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Previous page"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </Button>

        <div className="flex items-center gap-1">
          {startPage > 1 && (
            <>
              <PageButton page={1} currentPage={currentPage} onClick={() => onPageChange(1)} />
              {startPage > 2 && <span className="px-2 text-muted-foreground">...</span>}
            </>
          )}

          {pages.map((page) => (
            <PageButton
              key={page}
              page={page}
              currentPage={currentPage}
              onClick={() => onPageChange(page)}
            />
          ))}

          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <span className="px-2 text-muted-foreground">...</span>}
              <PageButton
                page={totalPages}
                currentPage={currentPage}
                onClick={() => onPageChange(totalPages)}
              />
            </>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Next page"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Button>
      </div>

      {onItemsPerPageChange && itemsPerPage && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Show</span>
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className="rounded-md border border-border bg-background px-2 py-1 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span>per page</span>
        </div>
      )}
    </div>
  );
}

interface PageButtonProps {
  page: number;
  currentPage: number;
  onClick: () => void;
}

function PageButton({ page, currentPage, onClick }: PageButtonProps) {
  const isActive = page === currentPage;

  return (
    <button
      onClick={onClick}
      disabled={isActive}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        {
          "bg-primary text-primary-foreground": isActive,
          "hover:bg-accent hover:text-accent-foreground": !isActive,
          "cursor-default": isActive,
        }
      )}
      aria-label={`Page ${page}`}
      aria-current={isActive ? "page" : undefined}
    >
      {page}
    </button>
  );
}
