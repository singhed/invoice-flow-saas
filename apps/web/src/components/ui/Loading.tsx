import { cn } from "@/lib/utils";

export interface LoadingProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Loading({ className, size = "md" }: LoadingProps) {
  return (
    <div
      className={cn(
        "inline-block animate-spin rounded-full border-4 border-solid border-sky-500 border-r-transparent",
        {
          "h-4 w-4": size === "sm",
          "h-8 w-8": size === "md",
          "h-12 w-12": size === "lg",
        },
        className
      )}
      role="status"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}
