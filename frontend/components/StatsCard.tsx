"use client";

import { motion } from "framer-motion";

const ACCENT = "#60a5fa";

interface Props {
  title: string;
  value: number;
  icon: React.ReactNode;
  subtitle?: string;
  index: number;
}

function CornerBrackets({ color }: { color: string }) {
  const border = `1px solid ${color}`;
  const sz = 10;
  const pos = 10;
  return (
    <>
      <div className="absolute pointer-events-none" style={{ top: pos, left: pos, width: sz, height: sz, borderTop: border, borderLeft: border }} />
      <div className="absolute pointer-events-none" style={{ top: pos, right: pos, width: sz, height: sz, borderTop: border, borderRight: border }} />
      <div className="absolute pointer-events-none" style={{ bottom: pos, left: pos, width: sz, height: sz, borderBottom: border, borderLeft: border }} />
      <div className="absolute pointer-events-none" style={{ bottom: pos, right: pos, width: sz, height: sz, borderBottom: border, borderRight: border }} />
    </>
  );
}

export default function StatsCard({ title, value, icon, subtitle, index }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden rounded-xl p-5 cursor-default group"
      style={{
        background: "#08080d",
        border: "1px solid #1a1a26",
      }}
    >
      {/* Top accent line */}
      <div
        className="absolute inset-x-0 top-0 h-[1px] pointer-events-none"
        style={{ background: `linear-gradient(90deg, transparent, ${ACCENT}50, transparent)` }}
      />

      {/* Corner reticle brackets */}
      <CornerBrackets color={`${ACCENT}35`} />

      <div className="flex items-start justify-between mb-3 relative">
        <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "#52525b" }}>
          {title}
        </p>
        <span className="opacity-50 group-hover:opacity-90 transition-opacity" style={{ color: ACCENT }}>
          {icon}
        </span>
      </div>

      <motion.div
        className="text-[2.2rem] font-bold tabular-nums leading-none mb-1.5 relative"
        style={{ color: "#f4f4f5" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: index * 0.07 + 0.2 }}
      >
        {value.toLocaleString()}
      </motion.div>

      {subtitle && (
        <p className="text-[10px] relative" style={{ color: "#3f3f46" }}>{subtitle}</p>
      )}
    </motion.div>
  );
}
