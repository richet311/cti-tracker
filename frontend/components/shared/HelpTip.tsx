"use client";

import { useState, useRef, useEffect } from "react";
import { QuestionIcon as Question } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";

interface Props {
  title: string;
  steps: string[];
}

export function HelpTip({ title, steps }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-5 h-5 rounded-full flex items-center justify-center text-zinc-600 hover:text-zinc-400 hover:bg-white/[0.06] transition-colors cursor-pointer"
        title="How to use"
      >
        <Question className="w-3 h-3" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.13 }}
            className="absolute right-0 top-7 z-[250] w-72 rounded-xl p-4 shadow-2xl"
            style={{ background: "#18181b", border: "1px solid #3f3f46" }}
          >
            <p className="text-zinc-200 font-semibold text-[12px] mb-3">{title}</p>
            <ol className="space-y-2">
              {steps.map((step, i) => (
                <li key={i} className="flex gap-2.5 text-[12px] text-zinc-400 leading-relaxed">
                  <span
                    className="shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold mt-0.5"
                    style={{ background: "#00c8ff18", color: "#00c8ff", border: "1px solid #00c8ff30" }}
                  >
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
