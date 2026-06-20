"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookmarkSimpleIcon as BookmarkSimple,
  TrashIcon as Trash,
  PlusIcon as Plus,
  ShieldWarningIcon as ShieldWarning,
  ArrowClockwiseIcon as ArrowClockwise,
} from "@phosphor-icons/react";
import {
  fetchWatchlist,
  removeFromWatchlist,
  WatchlistItem,
  SEVERITY_COLORS,
  SOURCE_COLORS,
  truncate,
} from "@/lib/api";
import Sidebar from "@/components/Sidebar";
import { PriorityBadge, SeverityBadge, TypeBadge } from "@/components/shared/badges";
import { AddModal } from "@/components/watchlist/AddModal";

const ACCENT = "#60a5fa";

// ── Page ──────────────────────────────────────────────────────────────────────

export default function WatchlistPage() {
  const [items, setItems]       = useState<WatchlistItem[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showAdd, setShowAdd]   = useState(false);
  const [removing, setRemoving] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchWatchlist();
      setItems(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleRemove(ioc_id: number) {
    setRemoving(ioc_id);
    try {
      await removeFromWatchlist(ioc_id);
      setItems((prev) => prev.filter((item) => item.ioc_id !== ioc_id));
    } finally {
      setRemoving(null);
    }
  }

  const highCount     = items.filter((i) => i.priority === "high").length;
  const criticalCount = items.filter((i) => i.severity === "critical").length;

  return (
    <>
      <div className="flex min-h-screen" style={{ background: "#09090b", color: "#e4e4e7" }}>
        <Sidebar
          active="overview"
          onChange={() => {}}
          watchlistCount={items.length}
        />

        <div className="flex-1 flex flex-col min-w-0">
          {/* ── Header ─────────────────────────────────────────────────── */}
          <header
            className="sticky top-0 z-30 h-14 flex items-center gap-3 px-5 shrink-0"
            style={{ background: "rgba(9,9,11,0.92)", backdropFilter: "blur(12px)", borderBottom: "1px solid #1c1c20" }}
          >
            <div className="flex items-center gap-1.5 text-sm min-w-0">
              <span className="text-zinc-600 shrink-0">Tools</span>
              <span className="text-zinc-700">/</span>
              <span className="text-zinc-300 font-medium">Priority Watchlist</span>
            </div>
            <div className="flex-1" />
            <button
              onClick={load}
              className="p-2 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04] transition-colors cursor-pointer"
              aria-label="Refresh"
            >
              <ArrowClockwise className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer"
              style={{ background: ACCENT, color: "#09090b" }}
            >
              <Plus className="w-3.5 h-3.5" weight="bold" />
              Add IOC
            </button>
          </header>

        <div className="max-w-5xl mx-auto px-6 py-6 w-full">
          {/* ── Summary cards ──────────────────────────────────────────── */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <SummaryCard label="Total Watching"   value={items.length}  color={ACCENT} />
            <SummaryCard label="High Priority"    value={highCount}     color="#ef4444" />
            <SummaryCard label="Critical Severity" value={criticalCount} color={SEVERITY_COLORS.critical ?? "#ef4444"} />
          </div>

          {/* ── Table ──────────────────────────────────────────────────── */}
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: "1px solid #27272a", background: "#111114" }}
          >
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: "1px solid #27272a", background: "#0e0e12" }}
            >
              <div className="flex items-center gap-2">
                <BookmarkSimple className="w-4 h-4" style={{ color: ACCENT }} weight="fill" />
                <span className="text-sm font-semibold text-zinc-300">Watchlist</span>
                {!loading && (
                  <span
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded tabular-nums"
                    style={{ background: "#222226", color: "#52525b" }}
                  >
                    {items.length}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-600">
                Sorted by priority · Requires analyst role to modify
              </p>
            </div>

            {loading ? (
              <LoadingSkeleton />
            ) : items.length === 0 ? (
              <EmptyWatchlist onAdd={() => setShowAdd(true)} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr
                      className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500"
                      style={{ borderBottom: "1px solid #27272a" }}
                    >
                      <th className="text-left px-5 py-3">Priority</th>
                      <th className="text-left px-4 py-3">Severity</th>
                      <th className="text-left px-4 py-3">Type</th>
                      <th className="text-left px-4 py-3">Value</th>
                      <th className="text-left px-4 py-3">Family</th>
                      <th className="text-left px-4 py-3">Source</th>
                      <th className="text-left px-4 py-3">Reason</th>
                      <th className="text-left px-4 py-3">Added</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {items.map((item, i) => (
                        <motion.tr
                          key={item.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ delay: i * 0.02 }}
                          className="border-b border-zinc-800/50 hover:bg-white/[0.02] transition-colors group"
                        >
                          <td className="px-5 py-3">
                            <PriorityBadge priority={item.priority} />
                          </td>
                          <td className="px-4 py-3">
                            <SeverityBadge severity={item.severity} />
                          </td>
                          <td className="px-4 py-3">
                            <TypeBadge iocType={item.ioc_type} />
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className="font-mono text-[12px] text-zinc-300 cursor-pointer hover:text-zinc-100 transition-colors"
                              title={item.value}
                              onClick={() => navigator.clipboard.writeText(item.value)}
                            >
                              {truncate(item.value, 42)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {item.malware_family
                              ? <span className="text-[#fbbf24] text-xs font-semibold">{item.malware_family}</span>
                              : <span className="text-zinc-700 text-xs">—</span>}
                          </td>
                          <td className="px-4 py-3">
                            {item.source
                              ? <span className="text-xs capitalize" style={{ color: SOURCE_COLORS[item.source] ?? "#64748b" }}>{item.source}</span>
                              : <span className="text-zinc-700 text-xs">—</span>}
                          </td>
                          <td className="px-4 py-3 text-zinc-500 text-xs max-w-[140px] truncate" title={item.reason ?? ""}>
                            {item.reason || <span className="text-zinc-700">—</span>}
                          </td>
                          <td className="px-4 py-3 text-zinc-600 text-xs font-mono">
                            {item.added_at?.slice(0, 10) ?? "—"}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleRemove(item.ioc_id)}
                              disabled={removing === item.ioc_id}
                              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-400/10 transition-all cursor-pointer"
                              aria-label="Remove from watchlist"
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {items.some((i) => i.priority === "high") && (
            <div
              className="mt-4 rounded-xl px-4 py-3 flex items-start gap-3"
              style={{ background: "#ef444410", border: "1px solid #ef444425" }}
            >
              <ShieldWarning className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#ef4444" }} weight="fill" />
              <div>
                <p className="text-xs font-semibold text-red-400 mb-0.5">
                  {highCount} high-priority {highCount === 1 ? "indicator" : "indicators"} require active monitoring
                </p>
                <p className="text-[11px] text-zinc-500">
                  High-priority IOCs should be checked against your environment and blocked at the network perimeter.
                </p>
              </div>
            </div>
          )}
        </div>
        </div>
      </div>

      <AnimatePresence>
        {showAdd && (
          <AddModal
            onClose={() => setShowAdd(false)}
            onAdded={load}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function SummaryCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div
      className="rounded-xl px-5 py-4"
      style={{ background: "#111114", border: "1px solid #27272a" }}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">{label}</p>
      <p className="text-2xl font-black tabular-nums" style={{ color }}>{value}</p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="divide-y divide-zinc-800/60">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-3.5 animate-pulse">
          <div className="w-14 h-5 rounded-full bg-zinc-800" />
          <div className="w-14 h-5 rounded-full bg-zinc-800" />
          <div className="w-12 h-5 rounded bg-zinc-800" />
          <div className="flex-1 h-4 rounded bg-zinc-800" />
          <div className="w-20 h-4 rounded bg-zinc-800" />
          <div className="w-8 h-5 rounded bg-zinc-800" />
        </div>
      ))}
    </div>
  );
}

function EmptyWatchlist({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
        style={{ background: `${ACCENT}12`, border: `1px solid ${ACCENT}25` }}
      >
        <BookmarkSimple className="w-6 h-6" style={{ color: ACCENT }} />
      </div>
      <p className="text-zinc-400 font-medium text-sm mb-1">Watchlist is empty</p>
      <p className="text-zinc-600 text-xs max-w-xs leading-relaxed mb-4">
        Add high-priority IOCs here to track them separately from the main feed.
        Watchlisted indicators appear sorted by priority for quick triage.
      </p>
      <button
        onClick={onAdd}
        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all"
        style={{ background: `${ACCENT}18`, color: ACCENT, border: `1px solid ${ACCENT}30` }}
      >
        <Plus className="w-3.5 h-3.5" weight="bold" />
        Add first IOC
      </button>
    </div>
  );
}
