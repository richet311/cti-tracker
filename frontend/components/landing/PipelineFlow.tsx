"use client";

import { motion } from "framer-motion";
import {
  DatabaseIcon as Database,
  MagnifyingGlassIcon as MagnifyingGlass,
  FileTextIcon as FileText,
} from "@phosphor-icons/react";
import { ACCENT } from "./landing-constants";

const STEPS = [
  {
    num: "01",
    label: "Collect",
    sub: "Pull live IOCs from MalwareBazaar, URLhaus & FeodoTracker",
    Icon: Database,
  },
  {
    num: "02",
    label: "Analyze",
    sub: "Cluster threats, map MITRE ATT&CK TTPs, track campaigns",
    Icon: MagnifyingGlass,
  },
  {
    num: "03",
    label: "Report",
    sub: "Produce finished intelligence and export to stakeholders",
    Icon: FileText,
  },
];

function FlowConnector({ delay }: { delay: number }) {
  return (
    <div className="relative flex items-center shrink-0" style={{ width: 40 }}>
      {/* static dashed line */}
      <svg width="40" height="2" className="absolute">
        <line
          x1="0" y1="1" x2="40" y2="1"
          stroke={ACCENT}
          strokeOpacity="0.2"
          strokeWidth="1"
          strokeDasharray="3 3"
        />
      </svg>
      {/* animated dot */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 5,
          height: 5,
          background: ACCENT,
          boxShadow: `0 0 8px ${ACCENT}`,
          top: "50%",
          marginTop: -2.5,
          left: 0,
        }}
        animate={{ left: [0, 35, 0] }}
        transition={{
          delay,
          duration: 2.4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}

export function PipelineFlow() {
  return (
    <div className="flex items-stretch gap-0">
      {STEPS.map((step, i) => (
        <div key={step.label} className="flex items-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.15 + 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-2 px-4 py-3 rounded-xl"
            style={{
              background: "linear-gradient(135deg, #18181b 0%, #111114 100%)",
              border: `1px solid ${ACCENT}20`,
              boxShadow: `0 0 0 1px #ffffff04, inset 0 1px 0 ${ACCENT}10`,
              minWidth: 130,
            }}
          >
            {/* step number */}
            <span
              className="font-mono text-[10px] font-bold tracking-widest"
              style={{ color: `${ACCENT}55` }}
            >
              {step.num}
            </span>

            {/* icon + label row */}
            <div className="flex items-center gap-2">
              <div
                className="flex items-center justify-center rounded-lg shrink-0"
                style={{
                  width: 28,
                  height: 28,
                  background: `${ACCENT}12`,
                  border: `1px solid ${ACCENT}28`,
                }}
              >
                <step.Icon
                  className="w-3.5 h-3.5"
                  weight="bold"
                  style={{ color: ACCENT }}
                />
              </div>
              <span className="text-[13px] font-semibold text-zinc-100 tracking-tight">
                {step.label}
              </span>
            </div>

            {/* description */}
            <p className="text-[10.5px] leading-snug text-zinc-500" style={{ maxWidth: 108 }}>
              {step.sub}
            </p>
          </motion.div>

          {i < STEPS.length - 1 && (
            <FlowConnector delay={i * 0.8 + 0.6} />
          )}
        </div>
      ))}
    </div>
  );
}
