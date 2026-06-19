"use client";

import { motion } from "framer-motion";
import {
  SquaresFourIcon as SquaresFour,
  HashIcon as Hash,
  UsersThreeIcon as UsersThree,
  FileTextIcon as FileText,
  WifiHighIcon as WifiHigh,
} from "@phosphor-icons/react";

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

type PhosphorIcon = React.ComponentType<{
  className?: string;
  weight?: "thin" | "light" | "regular" | "bold" | "fill" | "duotone";
  style?: React.CSSProperties;
}>;

const TABS: { id: Tab; label: string; Icon: PhosphorIcon; countKey?: keyof Counts }[] = [
  { id: "overview",  label: "Overview",  Icon: SquaresFour },
  { id: "iocs",      label: "IOCs",       Icon: Hash,         countKey: "iocs" },
  { id: "campaigns", label: "Campaigns",  Icon: UsersThree,   countKey: "campaigns" },
  { id: "reports",   label: "Reports",    Icon: FileText,      countKey: "reports" },
  { id: "feed",      label: "Live Feed",  Icon: WifiHigh },
];

const ACCENT = "#00c8ff";

export default function NavTabs({ active, onChange, counts, collecting }: Props) {
  return (
    <div
      className="flex items-center overflow-x-auto"
      style={{ background: "#09090b" }}
    >
      {TABS.map((tab) => {
        const isActive = tab.id === active;
        const count = tab.countKey ? counts?.[tab.countKey] : undefined;

        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`relative flex items-center gap-1.5 px-5 py-3.5 text-[13px] font-medium whitespace-nowrap transition-colors cursor-pointer ${
              isActive ? "text-[#00c8ff]" : "text-zinc-500 hover:text-zinc-200"
            }`}
          >
            <tab.Icon
              className="w-3.5 h-3.5"
              weight={isActive ? "bold" : "regular"}
              style={{ color: isActive ? ACCENT : "inherit" }}
            />
            <span>{tab.label}</span>

            {tab.id === "feed" && collecting && (
              <motion.span
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ repeat: Infinity, duration: 1.2 }}
                className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ background: `${ACCENT}20`, color: ACCENT }}
              >
                LIVE
              </motion.span>
            )}

            {tab.id !== "feed" && count !== undefined && count > 0 && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded font-semibold tabular-nums"
                style={
                  isActive
                    ? { background: `${ACCENT}1a`, color: ACCENT }
                    : { background: "#222226", color: "#52525b" }
                }
              >
                {count.toLocaleString()}
              </span>
            )}

            {isActive && (
              <motion.div
                layoutId="mobile-tab-underline"
                className="absolute bottom-0 left-0 right-0 h-[1.5px]"
                style={{ background: ACCENT }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
