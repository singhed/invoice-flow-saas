"use client";
import * as React from "react";
import { ToastProvider, ToastViewport, Toast, ToastTitle, ToastDescription, ToastClose } from "@/components/primitives/toast";

export type ToastMessage = { id: string; title: string; description?: string };

const ToastContext = React.createContext<{
  toasts: ToastMessage[];
  pushToast: (t: Omit<ToastMessage, "id">) => void;
} | null>(null);

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within NotificationToastStack");
  return ctx;
}

export function NotificationToastStack({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  const pushToast = React.useCallback((t: Omit<ToastMessage, "id">) => {
    setToasts((prev) => [...prev, { id: Math.random().toString(36).slice(2), ...t }]);
  }, []);

  const remove = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastProvider swipeDirection="right">
      <ToastContext.Provider value={{ toasts, pushToast }}>
        {children}
        <ToastViewport />
        {toasts.map((t) => (
          <Toast key={t.id} onOpenChange={(open) => !open && remove(t.id)}>
            <ToastTitle>{t.title}</ToastTitle>
            {t.description && <ToastDescription>{t.description}</ToastDescription>}
            <ToastClose />
          </Toast>
        ))}
      </ToastContext.Provider>
    </ToastProvider>
  );
}
