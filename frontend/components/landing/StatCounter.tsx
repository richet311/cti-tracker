"use client";

import { useRef, useState, useEffect } from "react";
import { useInView, animate } from "framer-motion";
import { ACCENT } from "./landing-constants";

interface Props {
  value: string;
  suffix: string;
  label: string;
}

export function StatCounter({ value, suffix, label }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    if (!inView) return;
    const target = parseInt(value);
    const ctrl = animate(0, target, {
      duration: 1.4,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(Math.round(v) + suffix),
    });
    return () => ctrl.stop();
  }, [inView, value, suffix]);

  return (
    <div ref={ref} className="px-4 flex flex-col items-center">
      <div
        className="text-3xl font-black mb-1 tabular-nums"
        style={{
          background: `linear-gradient(135deg, #80eeff 0%, ${ACCENT} 55%, #38cfff 100%)`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        {display}
      </div>
      <div className="text-zinc-500 text-xs tracking-wide">{label}</div>
    </div>
  );
}
