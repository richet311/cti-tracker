"use client";

import { motion } from "framer-motion";
import { LayoutDashboard, Hash, Shield, FileText, Radio } from "lucide-react";

export type Tab = "overview" | "iocs" | "campaigns" | "reports" | "feed";

interface Counts {
  iocs?: number;
  campaigns?: number;
  reports?: number;
}

interface Props {
  active: Tab;
  onChange: (tab: Tab) => void;
  counts?: Counts;
  collecting?: boolean;
}

const TABS: {
  id: Tab;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  countKey?: keyof Counts;
}[] = [
  { id: "overview", label: "Overview", Icon: LayoutDashboard },
  { id: "iocs", label: "IOCs", Icon: Hash, countKey: "iocs" },
  { id: "campaigns", label: "Campaigns", Icon: Shield, countKey: "campaigns" },
  { id: "reports", label: "Reports", Icon: FileText, countKey: "reports" },
  { id: "feed", label: "Live Feed", Icon: Radio },
];

export default function NavTabs({ active, onChange, counts, collecting }: Props) {
  return (
    <div className="flex items-center overflow-x-auto">
      {TABS.map((tab) => {
        const isActive = tab.id === active;
        const count = tab.countKey ? counts?.[tab.countKey] : undefined;

        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`relative flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-colors ${
              isActive
                ? "text-[#00c8ff]"
                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
            }`}
          >
            <tab.Icon className="w-4 h-4" />
            <span>{tab.label}</span>

            {tab.id === "feed" && collecting && (
              <motion.span
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ repeat: Infinity, duration: 1.2 }}
                className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#00c8ff20] text-[#00c8ff]"
              >
                LIVE
              </motion.span>
            )}

            {tab.id !== "feed" && count !== undefined && count > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold tabular-nums ${
                  isActive
                    ? "bg-[#00c8ff20] text-[#00c8ff]"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                }`}
              >
                {count.toLocaleString()}
              </span>
            )}

            {isActive && (
              <motion.div
                layoutId="tab-underline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00c8ff]"
                style={{ borderRadius: 1 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
