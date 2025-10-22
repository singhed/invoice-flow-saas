import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  className,
  variant = "rectangular",
  width,
  height,
  style,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-muted",
        {
          "rounded-full": variant === "circular",
          "rounded-md": variant === "rectangular",
          rounded: variant === "text",
        },
        className
      )}
      style={{
        width,
        height,
        ...style,
      }}
      aria-hidden="true"
      {...props}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-lg border border-border bg-card p-5 shadow">
      <div className="space-y-3">
        <Skeleton variant="text" height="1.5rem" width="70%" />
        <Skeleton variant="text" height="1rem" width="40%" />
        <div className="space-y-2 pt-2">
          <div className="flex justify-between">
            <Skeleton variant="text" height="0.875rem" width="30%" />
            <Skeleton variant="text" height="0.875rem" width="25%" />
          </div>
          <div className="flex justify-between">
            <Skeleton variant="text" height="0.875rem" width="25%" />
            <Skeleton variant="text" height="0.875rem" width="30%" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <div className="flex gap-4">
        <Skeleton height="2.5rem" width="40%" />
        <Skeleton height="2.5rem" width="30%" />
        <Skeleton height="2.5rem" width="30%" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton height="3rem" width="40%" />
          <Skeleton height="3rem" width="30%" />
          <Skeleton height="3rem" width="30%" />
        </div>
      ))}
    </div>
  );
}
