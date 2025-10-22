import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "error" | "info";
  size?: "sm" | "md" | "lg";
}

const variantStyles = {
  default: "bg-muted text-muted-foreground",
  success: "bg-green-900/30 text-green-400 ring-1 ring-green-500/30",
  warning: "bg-yellow-900/30 text-yellow-400 ring-1 ring-yellow-500/30",
  error: "bg-red-900/30 text-red-400 ring-1 ring-red-500/30",
  info: "bg-blue-900/30 text-blue-400 ring-1 ring-blue-500/30",
};

const sizeStyles = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-xs",
  lg: "px-3 py-1.5 text-sm",
};

export function Badge({
  className,
  variant = "default",
  size = "md",
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
