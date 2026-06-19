"use client";

import { motion } from "framer-motion";
import {
  ShieldIcon as Shield,
  HashIcon as Hash,
  StackIcon as Stack,
  ClockIcon as Clock,
} from "@phosphor-icons/react";
import { Campaign } from "@/lib/api";

interface Props {
  campaigns: Campaign[];
}

const MOTIVATION_COLORS: Record<string, { text: string; bg: string }> = {
  espionage:  { text: "#00c8ff", bg: "#00c8ff18" },
  financial:  { text: "#fbbf24", bg: "#fbbf2418" },
  disruptive: { text: "#ff4444", bg: "#ff444418" },
  hacktivism: { text: "#9f7aea", bg: "#9f7aea18" },
  unknown:    { text: "#71717a", bg: "#71717a18" },
};

const STATUS_STYLES: Record<string, string> = {
  active:     "text-[#00ff88] bg-[#00ff8812] border-[#00ff8830]",
  closed:     "text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700",
  monitoring: "text-[#fbbf24] bg-[#fbbf2412] border-[#fbbf2430]",
};

export default function CampaignCards({ campaigns }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45, duration: 0.4 }}
    >
      <h2 className="text-zinc-600 dark:text-zinc-400 text-sm font-semibold uppercase tracking-widest mb-4">
        Tracked Campaigns
      </h2>

      {campaigns.length === 0 ? (
        <div className="card p-8 text-center text-zinc-400 dark:text-zinc-600 text-sm">
          No campaigns yet. Create one with{" "}
          <code className="text-zinc-600 dark:text-zinc-400 font-mono text-xs bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
            python main.py campaign create
          </code>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {campaigns.map((c, i) => (
            <CampaignItem key={c.id} campaign={c} index={i} />
          ))}
        </div>
      )}
    </motion.div>
  );
}

function CampaignItem({ campaign: c, index }: { campaign: Campaign; index: number }) {
  const mot = MOTIVATION_COLORS[c.motivation] ?? MOTIVATION_COLORS.unknown;
  const statusClass = STATUS_STYLES[c.status] ?? STATUS_STYLES.active;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45 + index * 0.06 }}
      className="card p-5 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all hover:-translate-y-0.5 group"
    >
      {/* Top row */}
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-zinc-800 dark:text-zinc-200 font-semibold text-sm leading-tight flex-1 pr-2">
          {c.name}
        </h3>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${statusClass}`}>
          {c.status.toUpperCase()}
        </span>
      </div>

      {/* Actor */}
      {c.threat_actor && (
        <div className="flex items-center gap-1.5 mb-3 text-zinc-500 text-xs">
          <Shield className="w-3 h-3" />
          <span className="font-mono">{c.threat_actor}</span>
        </div>
      )}

      {/* Motivation badge */}
      <span
        className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mb-4 capitalize"
        style={{ color: mot.text, background: mot.bg }}
      >
        {c.motivation}
      </span>

      {/* Stats row */}
      <div className="flex items-center gap-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-1.5 text-zinc-500 text-xs">
          <Hash className="w-3 h-3 text-[#00c8ff]" />
          <span className="text-zinc-700 dark:text-zinc-300 font-semibold">{c.ioc_count}</span>
          <span>IOCs</span>
        </div>
        <div className="flex items-center gap-1.5 text-zinc-500 text-xs">
          <Stack className="w-3 h-3 text-[#9f7aea]" />
          <span className="text-zinc-700 dark:text-zinc-300 font-semibold">{c.ttp_count}</span>
          <span>TTPs</span>
        </div>
        <div className="flex items-center gap-1.5 text-zinc-400 dark:text-zinc-500 text-xs ml-auto">
          <Clock className="w-3 h-3" />
          <span>{c.updated_at?.slice(0, 10) ?? "—"}</span>
        </div>
      </div>
    </motion.div>
  );
}
