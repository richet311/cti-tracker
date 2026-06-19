"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ACCENT, CYCLE_WORDS } from "./landing-constants";

export function CyclingWord() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % CYCLE_WORDS.length), 2800);
    return () => clearInterval(t);
  }, []);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={idx}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -14 }}
        transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
        className="inline-block"
        style={{
          background: `linear-gradient(125deg, #80eeff 0%, ${ACCENT} 40%, #38cfff 100%)`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          paddingBottom: "0.2em",
        }}
      >
        {CYCLE_WORDS[idx]}
      </motion.span>
    </AnimatePresence>
  );
}
