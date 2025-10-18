"use client";

import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cn } from "@/lib/utils";

export interface RadioItem {
  label: string;
  value: string;
  description?: string;
}

export interface RadioGroupProps extends React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root> {
  items: RadioItem[];
  name: string;
}

export const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  RadioGroupProps
>(({ className, items, name, ...props }, ref) => {
  const groupName = name;
  return (
    <RadioGroupPrimitive.Root ref={ref} className={cn("grid gap-2", className)} name={groupName} {...props}>
      {items.map((item) => {
        const id = `${groupName}-${item.value}`;
        return (
          <div key={item.value} className="flex items-start gap-3">
            <RadioGroupPrimitive.Item
              id={id}
              value={item.value}
              className="peer h-4 w-4 rounded-full border border-input text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <RadioGroupPrimitive.Indicator className="flex h-full w-full items-center justify-center">
                <div className="h-2.5 w-2.5 rounded-full bg-primary" />
              </RadioGroupPrimitive.Indicator>
            </RadioGroupPrimitive.Item>
            <div>
              <LabelPrimitive.Root htmlFor={id} className="text-sm font-medium leading-none">
                {item.label}
              </LabelPrimitive.Root>
              {item.description && (
                <p className="text-xs text-muted-foreground">{item.description}</p>
              )}
            </div>
          </div>
        );
      })}
    </RadioGroupPrimitive.Root>
  );
});
RadioGroup.displayName = "RadioGroup";
