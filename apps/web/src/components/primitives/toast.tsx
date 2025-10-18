"use client";
import * as React from "react";
import * as ToastPrimitives from "@radix-ui/react-toast";
import { cn } from "@/lib/utils";

export const ToastProvider = ToastPrimitives.Provider;

export function ToastViewport() {
  return (
    <ToastPrimitives.Viewport
      className="fixed bottom-0 right-0 z-50 m-4 flex w-96 max-w-screen pl-6 outline-none"
    />
  );
}

export interface ToastProps extends React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> {}

export const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  ToastProps
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Root
    ref={ref}
    className={cn(
      "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-80 data-[state=open]:fade-in-80 data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] group relative rounded-md border border-border bg-popover p-4 text-popover-foreground shadow-lg",
      className
    )}
    {...props}
  />
));
Toast.displayName = ToastPrimitives.Root.displayName;

export const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title ref={ref} className={cn("text-sm font-semibold", className)} {...props} />
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;

export const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description ref={ref} className={cn("text-sm opacity-90", className)} {...props} />
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;

export function ToastClose() {
  return (
    <ToastPrimitives.Close
      className="absolute right-2 top-2 rounded-md p-1 text-sm text-muted-foreground hover:bg-muted"
      aria-label="Close"
    >
      ✕
    </ToastPrimitives.Close>
  );
}
