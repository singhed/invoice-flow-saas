import { ReactNode } from "react";
import { Button } from "./Button";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: "primary" | "secondary" | "outline";
  };
  className?: string;
}

export function EmptyState({
  icon = "📄",
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 text-center", className)}>
      <div className="mb-4 text-6xl" aria-hidden="true">
        {icon}
      </div>
      <h3 className="mb-2 text-xl font-semibold text-foreground">{title}</h3>
      {description && <p className="mb-6 max-w-md text-sm text-muted-foreground">{description}</p>}
      {action && (
        <Button onClick={action.onClick} variant={action.variant || "primary"} size="lg">
          {action.label}
        </Button>
      )}
    </div>
  );
}
