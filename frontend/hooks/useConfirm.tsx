"use client";

import {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
  useEffect,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WarningCircleIcon as WarningCircle } from "@phosphor-icons/react";

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  destructive?: boolean;
}

interface DialogState extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const resolveRef = useRef<((v: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setDialog({ ...opts, resolve });
    });
  }, []);

  function settle(value: boolean) {
    resolveRef.current?.(value);
    setDialog(null);
  }

  useEffect(() => {
    if (!dialog) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") settle(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dialog]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}

      <AnimatePresence>
        {dialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
            onClick={(e) => { if (e.target === e.currentTarget) settle(false); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.16 }}
              className="w-full max-w-xs rounded-2xl p-6 flex flex-col items-center text-center gap-3"
              style={{ background: "#111114", border: "1px solid #27272a" }}
              role="alertdialog"
              aria-modal="true"
            >
              {/* Icon */}
              <WarningCircle className="w-9 h-9 text-red-400 mb-0.5" weight="duotone" />

              {/* Title */}
              <h2 className="text-zinc-100 font-semibold text-sm leading-snug">
                {dialog.title}
              </h2>

              {/* Description */}
              {dialog.description && (
                <p className="text-zinc-500 text-[12px] leading-relaxed">
                  {dialog.description}
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-2 w-full pt-2">
                <button
                  onClick={() => settle(false)}
                  className="flex-1 px-4 py-2 rounded-lg text-xs font-semibold text-zinc-400 border border-zinc-800 hover:border-zinc-600 hover:text-zinc-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => settle(true)}
                  autoFocus
                  className="flex-1 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                  style={
                    dialog.destructive === false
                      ? { background: "#00c8ff", color: "#09090b" }
                      : { background: "#ef4444", color: "#fff" }
                  }
                >
                  {dialog.confirmLabel ?? "Delete"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used inside ConfirmProvider");
  return ctx;
}
