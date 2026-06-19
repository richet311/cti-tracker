"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BrandMark } from "@/components/shared/BrandMark";
import {
  SquaresFourIcon as SquaresFour,
  HashIcon as Hash,
  UsersThreeIcon as UsersThree,
  FileTextIcon as FileText,
  WifiHighIcon as WifiHigh,
  MagnifyingGlassIcon as MagnifyingGlass,
  BookmarkSimpleIcon as BookmarkSimple,
  DownloadSimpleIcon as DownloadSimple,
  ArrowLeftIcon as ArrowLeft,
  LockKeyIcon as LockKey,
} from "@phosphor-icons/react";

export type Tab =
  | "overview"
  | "iocs"
  | "campaigns"
  | "reports"
  | "feed";

const ACCENT = "#60a5fa";

type PhosphorIcon = React.ComponentType<{
  className?: string;
  weight?: "thin" | "light" | "regular" | "bold" | "fill" | "duotone";
  style?: React.CSSProperties;
}>;

const PLATFORM_NAV: { id: Tab; label: string; Icon: PhosphorIcon }[] = [
  { id: "overview",  label: "Overview",  Icon: SquaresFour },
  { id: "iocs",      label: "IOCs",       Icon: Hash },
  { id: "campaigns", label: "Campaigns",  Icon: UsersThree },
  { id: "reports",   label: "Reports",    Icon: FileText },
  { id: "feed",      label: "Live Feed",  Icon: WifiHigh },
];

const TOOLS_NAV: { href: string; label: string; Icon: PhosphorIcon; badge?: string }[] = [
  { href: "/hunt",      label: "IOC Hunt",   Icon: MagnifyingGlass, badge: "Search" },
  { href: "/watchlist", label: "Watchlist",  Icon: BookmarkSimple },
];

const FEED_SOURCES = [
  { label: "MalwareBazaar", ok: true },
  { label: "URLhaus",        ok: true },
  { label: "FeodoTracker",   ok: true },
];

interface Props {
  active: Tab;
  onChange: (tab: Tab) => void;
  counts?: Partial<Record<Tab, number>>;
  collecting?: boolean;
  watchlistCount?: number;
}

export default function Sidebar({ active, onChange, counts, collecting, watchlistCount }: Props) {
  return (
    <aside
      className="hidden md:flex flex-col w-[220px] shrink-0 min-h-screen"
      style={{ background: "#09090b", borderRight: "1px solid #1c1c20" }}
    >
      {/* Brand */}
      <div
        className="flex items-center gap-2.5 px-5 h-14 shrink-0"
        style={{ borderBottom: "1px solid #1c1c20" }}
      >
        <BrandMark size={18} color={ACCENT} />
        <span className="font-bold tracking-tight text-sm">
          <span className="text-zinc-100">CTI</span>
          <span style={{ color: ACCENT }}>Tracker</span>
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-4">
        {/* Platform tabs */}
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] px-3 pb-2 text-zinc-600">
            Platform
          </p>
          <div className="space-y-0.5">
            {PLATFORM_NAV.map((item) => {
              const isActive = item.id === active;
              const count = counts?.[item.id];
              const isLive = item.id === "feed" && collecting;

              return (
                <button
                  key={item.id}
                  onClick={() => onChange(item.id)}
                  className={`relative w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all cursor-pointer ${
                    isActive
                      ? ""
                      : "text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04]"
                  }`}
                  style={isActive ? { background: `${ACCENT}0c`, color: ACCENT } : undefined}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-bar"
                      className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-full"
                      style={{ background: ACCENT }}
                      transition={{ type: "spring", stiffness: 400, damping: 34 }}
                    />
                  )}

                  <item.Icon
                    className="w-4 h-4 shrink-0"
                    weight={isActive ? "bold" : "regular"}
                    style={{ color: isActive ? ACCENT : "inherit" }}
                  />
                  <span className="flex-1 text-left">{item.label}</span>

                  {isLive && (
                    <motion.span
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ repeat: Infinity, duration: 1.2 }}
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: ACCENT }}
                    />
                  )}

                  {!isLive && count !== undefined && count > 0 && (
                    <span
                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded tabular-nums shrink-0"
                      style={
                        isActive
                          ? { background: `${ACCENT}1a`, color: ACCENT }
                          : { background: "#222226", color: "#52525b" }
                      }
                    >
                      {count > 9999 ? `${(count / 1000).toFixed(1)}k` : count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tools (links to other pages) */}
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] px-3 pb-2 text-zinc-600">
            Tools
          </p>
          <div className="space-y-0.5">
            {TOOLS_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="relative w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04] transition-all cursor-pointer"
              >
                <item.Icon className="w-4 h-4 shrink-0" weight="regular" />
                <span className="flex-1">{item.label}</span>
                {item.href === "/watchlist" && watchlistCount !== undefined && watchlistCount > 0 && (
                  <span
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded tabular-nums shrink-0"
                    style={{ background: "#222226", color: "#52525b" }}
                  >
                    {watchlistCount}
                  </span>
                )}
              </Link>
            ))}
            <Link
              href="/login"
              className="relative w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04] transition-all cursor-pointer"
            >
              <LockKey className="w-4 h-4 shrink-0" weight="regular" />
              <span className="flex-1">Login</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Feed status + back */}
      <div className="px-3 pb-4" style={{ borderTop: "1px solid #1c1c20" }}>
        <div
          className="rounded-xl px-3 py-3 mt-3 mb-2"
          style={{ background: "#111114", border: "1px solid #1e1e22" }}
        >
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-600 mb-3">
            Feed Status
          </p>
          <div className="space-y-2">
            {FEED_SOURCES.map((s) => (
              <div key={s.label} className="flex items-center justify-between">
                <span className="text-[11px] text-zinc-500">{s.label}</span>
                <div className="flex items-center gap-1.5">
                  <motion.span
                    animate={s.ok ? { opacity: [1, 0.4, 1] } : {}}
                    transition={{ repeat: Infinity, duration: 2.4 }}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: s.ok ? "#22c55e" : "#ef4444" }}
                  />
                  <span
                    className="text-[9px] font-bold uppercase tracking-wide"
                    style={{ color: s.ok ? "#22c55e" : "#ef4444" }}
                  >
                    {s.ok ? "live" : "err"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.04] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" weight="bold" />
          <span>Back to Home</span>
        </Link>
      </div>
    </aside>
  );
}
