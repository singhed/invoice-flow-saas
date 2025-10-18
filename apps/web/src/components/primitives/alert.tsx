import * as React from "react";
import { cn } from "@/lib/utils";

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "destructive" | "success" | "warning";
}

export function Alert({ className, variant = "default", ...props }: AlertProps) {
  const variants: Record<NonNullable<AlertProps["variant"]>, string> = {
    default: "bg-muted text-foreground",
    destructive: "bg-destructive/15 text-destructive border-destructive",
    success: "bg-emerald-500/15 text-emerald-500 border-emerald-500/40",
    warning: "bg-amber-500/15 text-amber-500 border-amber-500/40",
  };

  return (
    <div role="alert" className={cn("rounded-md border p-4", variants[variant], className)} {...props} />
  );
}
