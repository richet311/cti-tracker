"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircleIcon as CheckCircle,
  WarningCircleIcon as WarningCircle,
  InfoIcon as Info,
  XIcon as X,
} from "@phosphor-icons/react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

type AddToast = (message: string, type?: ToastType) => void;

const ToastContext = createContext<AddToast | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = "success") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  function remove(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  const iconColor = {
    success: "#22c55e",
    error:   "#ef4444",
    info:    "#60a5fa",
  };

  const borderColor = {
    success: "#22c55e25",
    error:   "#ef444425",
    info:    "#60a5fa25",
  };

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="fixed bottom-5 right-5 z-[300] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 40, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.95 }}
              transition={{ duration: 0.18 }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl pointer-events-auto"
              style={{
                background: "#111114",
                border: `1px solid ${borderColor[toast.type]}`,
                minWidth: 240,
                maxWidth: 360,
                boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
              }}
            >
              {toast.type === "success" && <CheckCircle className="w-4 h-4 shrink-0" style={{ color: iconColor.success }} />}
              {toast.type === "error"   && <WarningCircle className="w-4 h-4 shrink-0" style={{ color: iconColor.error }} />}
              {toast.type === "info"    && <Info className="w-4 h-4 shrink-0" style={{ color: iconColor.info }} />}
              <span className="text-zinc-200 text-[13px] flex-1">{toast.message}</span>
              <button
                onClick={() => remove(toast.id)}
                className="text-zinc-600 hover:text-zinc-300 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): AddToast {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
