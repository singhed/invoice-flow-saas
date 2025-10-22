"use client";

import { createContext, useCallback, useState, ReactNode } from "react";
import { Toast, ToastContainer, ToastProps } from "@/components/ui/Toast";

type ToastOptions = Omit<ToastProps, "id" | "onClose">;

interface ToastContextValue {
  toasts: ToastProps[];
  addToast: (options: ToastOptions) => void;
  removeToast: (id: string) => void;
}

export const ToastContext = createContext<ToastContextValue | undefined>(undefined);

let toastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback(
    (options: ToastOptions) => {
      const id = `toast-${++toastId}`;
      const toast: ToastProps = {
        ...options,
        id,
        onClose: removeToast,
      };
      setToasts((prev) => [...prev, toast]);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer>
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} />
        ))}
      </ToastContainer>
    </ToastContext.Provider>
  );
}
