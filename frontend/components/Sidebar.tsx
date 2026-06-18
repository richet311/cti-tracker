"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Shield, LayoutDashboard, Hash, Target,
  FileText, Radio, ArrowLeft,
} from "lucide-react";

export type Tab = "overview" | "iocs" | "campaigns" | "reports" | "feed";

interface NavItem {
  id: Tab;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
}

const NAV: NavItem[] = [
  { id: "overview",  label: "Overview",   Icon: LayoutDashboard },
  { id: "iocs",      label: "IOCs",        Icon: Hash },
  { id: "campaigns", label: "Campaigns",   Icon: Target },
  { id: "reports",   label: "Reports",     Icon: FileText },
  { id: "feed",      label: "Live Feed",   Icon: Radio },
];

interface Props {
  active: Tab;
  onChange: (tab: Tab) => void;
  counts?: Partial<Record<Tab, number>>;
  collecting?: boolean;
}

export default function Sidebar({ active, onChange, counts, collecting }: Props) {
  return (
    <aside className="hidden md:flex flex-col w-56 shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#09090b] min-h-screen">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-zinc-200 dark:border-zinc-800">
        <div className="p-1.5 rounded-lg bg-[#00c8ff18] border border-[#00c8ff30]">
          <Shield className="w-4 h-4 text-[#00c8ff]" />
        </div>
        <div>
          <div className="text-zinc-900 dark:text-zinc-100 text-sm font-bold leading-none">CTI Tracker</div>
          <div className="text-zinc-400 dark:text-zinc-600 text-[10px] mt-0.5">Intelligence Platform</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        <p className="text-zinc-400 dark:text-zinc-700 text-[9px] font-bold uppercase tracking-widest px-3 pt-3 pb-2">
          Platform
        </p>

        {NAV.map((item) => {
          const isActive = item.id === active;
          const count = counts?.[item.id];
          const isLive = item.id === "feed" && collecting;

          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative ${
                isActive
                  ? "bg-[#00c8ff12] text-[#00c8ff] border border-[#00c8ff22]"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 border border-transparent"
              }`}
            >
              <item.Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? "text-[#00c8ff]" : "text-zinc-400 dark:text-zinc-600 group-hover:text-zinc-600 dark:group-hover:text-zinc-400"}`} />
              <span className="flex-1 text-left">{item.label}</span>

              {/* LIVE pulse */}
              {isLive && (
                <motion.span
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                  className="w-1.5 h-1.5 rounded-full bg-[#00c8ff]"
                />
              )}

              {/* Count badge */}
              {!isLive && count !== undefined && count > 0 && (
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md tabular-nums ${
                    isActive
                      ? "bg-[#00c8ff20] text-[#00c8ff]"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-500"
                  }`}
                >
                  {count.toLocaleString()}
                </span>
              )}

              {/* Active left bar */}
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-[#00c8ff]"
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Back to home */}
      <div className="p-3 border-t border-zinc-200 dark:border-zinc-800">
        <Link
          href="/"
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-zinc-500 text-sm hover:text-zinc-800 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
      </div>
    </aside>
  );
}
