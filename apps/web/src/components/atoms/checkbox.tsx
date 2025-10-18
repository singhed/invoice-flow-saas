"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import * as LabelPrimitive from "@radix-ui/react-label";
import { CheckIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";

export interface CheckboxProps extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {
  label?: string;
  id?: string;
}

export const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(({ className, label, id, ...props }, ref) => {
  const inputId = id ?? React.useId();
  return (
    <div className="flex items-center gap-2">
      <CheckboxPrimitive.Root
        id={inputId}
        ref={ref}
        className={cn(
          "peer flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-input bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      >
        <CheckboxPrimitive.Indicator className="text-primary">
          <CheckIcon className="h-3.5 w-3.5" />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      {label && (
        <LabelPrimitive.Root htmlFor={inputId} className="text-sm">
          {label}
        </LabelPrimitive.Root>
      )}
    </div>
  );
});
Checkbox.displayName = "Checkbox";
