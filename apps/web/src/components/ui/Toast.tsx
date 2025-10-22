"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";

export interface ToastProps {
  id: string;
  title?: string;
  message: string;
  variant?: "success" | "error" | "warning" | "info";
  duration?: number;
  onClose: (id: string) => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const variantStyles = {
  success: "bg-green-900/20 border-green-500/50 text-green-300",
  error: "bg-red-900/20 border-red-500/50 text-red-300",
  warning: "bg-yellow-900/20 border-yellow-500/50 text-yellow-300",
  info: "bg-blue-900/20 border-blue-500/50 text-blue-300",
};

const variantIcons = {
  success: (
    <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  error: (
    <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  warning: (
    <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  ),
  info: (
    <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
};

export function Toast({
  id,
  title,
  message,
  variant = "info",
  duration = 5000,
  onClose,
  action,
}: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [id, duration, onClose]);

  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      className={cn(
        "pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg border shadow-lg",
        "animate-in slide-in-from-right-full duration-300",
        variantStyles[variant]
      )}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {variantIcons[variant]}
          <div className="flex-1 space-y-1">
            {title && <p className="text-sm font-semibold">{title}</p>}
            <p className="text-sm opacity-90">{message}</p>
            {action && (
              <button
                onClick={action.onClick}
                className="mt-2 text-sm font-medium underline underline-offset-2 hover:no-underline"
              >
                {action.label}
              </button>
            )}
          </div>
          <button
            onClick={() => onClose(id)}
            className="flex-shrink-0 rounded-md p-1 opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2"
            aria-label="Close notification"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export function ToastContainer({ children }: { children: React.ReactNode }) {
  return (
    <div
      aria-label="Notifications"
      className="pointer-events-none fixed bottom-0 right-0 z-50 flex max-h-screen w-full flex-col-reverse gap-2 p-4 sm:flex-col sm:p-6 md:max-w-[420px]"
    >
      {children}
    </div>
  );
}
