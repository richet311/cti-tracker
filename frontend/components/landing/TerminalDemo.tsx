"use client";

import { useRef, useState, useEffect } from "react";
import { useInView, motion } from "framer-motion";
import { ACCENT, FEED_LINES } from "./landing-constants";

export function TerminalDemo() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [visible, setVisible] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const t = setInterval(() => {
      setVisible((v) => {
        if (v >= FEED_LINES.length) { clearInterval(t); return v; }
        return v + 1;
      });
    }, 720);
    return () => clearInterval(t);
  }, [inView]);

  return (
    <div
      ref={ref}
      className="rounded-xl overflow-hidden text-left"
      style={{
        background: "#0e0e12",
        boxShadow: `0 32px 80px rgba(0,0,0,0.55), 0 0 0 1px #27272a, 0 0 60px ${ACCENT}10`,
        borderTop: `1px solid ${ACCENT}50`,
      }}
    >
      <div
        className="flex items-center justify-between px-4 py-2.5 border-b"
        style={{ borderColor: "#1f1f27", background: "#131318" }}
      >
        <span style={{ color: "#71717a" }} className="text-[11px] font-mono">
          threat-intel-collector
        </span>
        <span
          className="flex items-center gap-1.5 text-[10px] font-bold font-mono uppercase tracking-wider px-2 py-0.5 rounded-full"
          style={{ color: ACCENT, background: `${ACCENT}14`, border: `1px solid ${ACCENT}30` }}
        >
          <motion.span
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ repeat: Infinity, duration: 1.4 }}
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: ACCENT, display: "inline-block" }}
          />
          live
        </span>
      </div>

      <div className="px-4 pt-3 pb-1 font-mono">
        <div className="text-[11px] mb-3 flex items-center gap-2">
          <span style={{ color: "#3f3f46" }}>~/cti</span>
          <span style={{ color: ACCENT, opacity: 0.5 }}>$</span>
          <span style={{ color: "#52525b" }}>python main.py collect --limit 50</span>
        </div>
      </div>

      <div className="px-4 pb-4 font-mono text-xs space-y-2 h-44 overflow-hidden">
        {FEED_LINES.slice(0, visible).map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.18 }}
            className="flex items-center gap-2.5"
          >
            <span
              className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold"
              style={{ color: ACCENT, background: `${ACCENT}14`, border: `1px solid ${ACCENT}28` }}
            >
              {line.type}
            </span>
            <span style={{ color: "#a1a1aa" }} className="truncate flex-1">{line.value}</span>
            <span style={{ color: "#3f3f46" }} className="shrink-0 text-[10px]">{line.src}</span>
          </motion.div>
        ))}
        {visible < FEED_LINES.length && (
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ repeat: Infinity, duration: 0.8 }}
            className="inline-block w-1.5 h-3.5 rounded-sm"
            style={{ background: ACCENT }}
          />
        )}
      </div>
    </div>
  );
}
