"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface Props {
  title: string;
  value: number;
  Icon: LucideIcon;
  accentColor: string;
  subtitle?: string;
  index: number;
}

export default function StatsCard({
  title,
  value,
  Icon,
  accentColor,
  subtitle,
  index,
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4, ease: "easeOut" }}
      className="card p-5 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors group"
    >
      <div className="flex items-start justify-between mb-4">
        <span className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold uppercase tracking-widest">
          {title}
        </span>
        <div
          className="p-2 rounded-lg transition-transform group-hover:scale-110"
          style={{ background: `${accentColor}18` }}
        >
          <Icon className="w-4 h-4" style={{ color: accentColor }} />
        </div>
      </div>

      <motion.div
        className="text-4xl font-bold tabular-nums"
        style={{ color: accentColor }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: index * 0.08 + 0.2 }}
      >
        {value.toLocaleString()}
      </motion.div>

      {subtitle && (
        <p className="text-zinc-500 dark:text-zinc-500 text-xs mt-2">{subtitle}</p>
      )}
    </motion.div>
  );
}
