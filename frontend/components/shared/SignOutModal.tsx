"use client";

import { motion, AnimatePresence } from "framer-motion";
import { SignOutIcon as SignOut, XIcon as X } from "@phosphor-icons/react";

interface Props {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function SignOutModal({ open, onCancel, onConfirm }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[200] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(6px)" }}
          onClick={onCancel}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.15 }}
            className="relative w-full max-w-sm mx-4 rounded-xl p-6"
            style={{ background: "#111114", border: "1px solid #27272a" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-center mb-4">
              <SignOut className="w-8 h-8 text-red-400" weight="bold" />
            </div>

            <h2 className="text-[15px] font-semibold text-zinc-100 text-center mb-1">Sign out?</h2>
            <p className="text-[12px] text-zinc-500 text-center mb-6">
              You&apos;ll be returned to the login screen.
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={onCancel}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[13px] text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
                style={{ background: "#1c1c20", border: "1px solid #27272a" }}
              >
                <X className="w-3.5 h-3.5" />
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[13px] font-semibold text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.22)" }}
              >
                <SignOut className="w-3.5 h-3.5" />
                Sign out
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
