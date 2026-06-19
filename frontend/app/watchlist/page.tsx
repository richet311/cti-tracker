"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeftIcon as ArrowLeft,
  BookmarkSimpleIcon as BookmarkSimple,
  TrashIcon as Trash,
  PlusIcon as Plus,
  ShieldWarningIcon as ShieldWarning,
  ArrowClockwiseIcon as ArrowClockwise,
  MagnifyingGlassIcon as MagnifyingGlass,
  XCircleIcon as XCircle,
} from "@phosphor-icons/react";
import {
  fetchWatchlist,
  removeFromWatchlist,
  addToWatchlist,
  searchIOCs,
  WatchlistItem,
  IOC,
  SEVERITY_COLORS,
  IOC_TYPE_COLORS,
  SOURCE_COLORS,
  truncate,
} from "@/lib/api";

const ACCENT = "#60a5fa";

// ── BrandMark ─────────────────────────────────────────────────────────────────

function BrandMark({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 2.5L20 6.5V13.5C20 17.6 16.5 21.3 12 22.5C7.5 21.3 4 17.6 4 13.5V6.5L12 2.5Z"
        stroke={ACCENT} strokeWidth="1.4" strokeLinejoin="round" fill={`${ACCENT}14`}
      />
      <circle cx="12" cy="13" r="2" fill={ACCENT} />
      <line x1="12" y1="8.5" x2="12" y2="11" stroke={ACCENT} strokeWidth="1.3" strokeLinecap="round" />
      <line x1="12" y1="15" x2="12" y2="17.5" stroke={ACCENT} strokeWidth="1.3" strokeLinecap="round" />
      <line x1="7.5" y1="13" x2="10" y2="13" stroke={ACCENT} strokeWidth="1.3" strokeLinecap="round" />
      <line x1="14" y1="13" x2="16.5" y2="13" stroke={ACCENT} strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

// ── Badges ────────────────────────────────────────────────────────────────────

const PRIORITY_COLORS = {
  high:   "#ef4444",
  medium: "#fbbf24",
  low:    "#94a3b8",
};

function PriorityBadge({ priority }: { priority: "low" | "medium" | "high" }) {
  const color = PRIORITY_COLORS[priority];
  return (
    <span
      className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
      style={{ color, background: `${color}18`, border: `1px solid ${color}30` }}
    >
      {priority}
    </span>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const color = SEVERITY_COLORS[severity] ?? "#94a3b8";
  return (
    <span
      className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
      style={{ color, background: `${color}18`, border: `1px solid ${color}30` }}
    >
      {severity}
    </span>
  );
}

function TypeBadge({ iocType }: { iocType: string }) {
  const labels: Record<string, string> = {
    hash_sha256: "SHA-256", hash_md5: "MD5", hash_sha1: "SHA-1",
    url: "URL", ip: "IP", domain: "Domain",
  };
  const color = IOC_TYPE_COLORS[iocType] ?? "#94a3b8";
  return (
    <span
      className="text-[10px] font-bold px-2 py-0.5 rounded font-mono"
      style={{ color, background: `${color}18`, border: `1px solid ${color}30` }}
    >
      {labels[iocType] ?? iocType}
    </span>
  );
}

// ── Add to Watchlist Modal ─────────────────────────────────────────────────────

function AddModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [q, setQ]                 = useState("");
  const [results, setResults]     = useState<IOC[]>([]);
  const [selected, setSelected]   = useState<IOC | null>(null);
  const [reason, setReason]       = useState("");
  const [priority, setPriority]   = useState<"low" | "medium" | "high">("medium");
  const [searching, setSearching] = useState(false);
  const [adding, setAdding]       = useState(false);
  const [error, setError]         = useState("");

  async function doSearch() {
    if (!q.trim()) return;
    setSearching(true);
    try {
      const data = await searchIOCs({ q: q.trim(), limit: 10 });
      setResults(data);
    } finally {
      setSearching(false);
    }
  }

  async function doAdd() {
    if (!selected) return;
    setAdding(true);
    setError("");
    try {
      await addToWatchlist(selected.id, reason, priority);
      onAdded();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed. Are you logged in as analyst or admin?");
    } finally {
      setAdding(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: "#111114", border: "1px solid #27272a", borderTop: `1px solid ${ACCENT}25` }}
      >
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid #1e1e22" }}>
          <div className="flex items-center gap-2">
            <BookmarkSimple className="w-4 h-4" style={{ color: ACCENT }} weight="fill" />
            <span className="text-sm font-semibold text-zinc-200">Add to Watchlist</span>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 cursor-pointer transition-colors">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* IOC Search */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-2">
              Search IOC
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && doSearch()}
                placeholder="Value, family, or threat type…"
                className="flex-1 px-3 py-2 rounded-lg text-xs bg-zinc-900 border border-zinc-800 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-blue-500/40 transition-colors"
              />
              <button
                onClick={doSearch}
                disabled={searching || !q.trim()}
                className="px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                style={{ background: ACCENT, color: "#09090b" }}
              >
                <MagnifyingGlass className="w-3.5 h-3.5" weight="bold" />
              </button>
            </div>
          </div>

          {/* Search results */}
          {results.length > 0 && !selected && (
            <div
              className="rounded-lg overflow-hidden max-h-40 overflow-y-auto"
              style={{ border: "1px solid #27272a" }}
            >
              {results.map((ioc) => (
                <button
                  key={ioc.id}
                  onClick={() => setSelected(ioc)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left text-xs hover:bg-white/[0.04] transition-colors cursor-pointer border-b last:border-0"
                  style={{ borderColor: "#27272a" }}
                >
                  <TypeBadge iocType={ioc.ioc_type} />
                  <span className="font-mono text-zinc-300 flex-1 truncate">{truncate(ioc.value, 38)}</span>
                  <SeverityBadge severity={ioc.severity} />
                </button>
              ))}
            </div>
          )}

          {/* Selected IOC */}
          {selected && (
            <div
              className="rounded-lg px-3 py-2.5 flex items-center gap-3"
              style={{ background: `${ACCENT}0c`, border: `1px solid ${ACCENT}25` }}
            >
              <TypeBadge iocType={selected.ioc_type} />
              <span className="font-mono text-xs text-zinc-300 flex-1 truncate">{truncate(selected.value, 40)}</span>
              <button
                onClick={() => setSelected(null)}
                className="text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer shrink-0"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Priority */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-2">
              Priority
            </label>
            <div className="flex gap-2">
              {(["high", "medium", "low"] as const).map((p) => {
                const color = PRIORITY_COLORS[p];
                const isActive = priority === p;
                return (
                  <button
                    key={p}
                    onClick={() => setPriority(p)}
                    className="flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer"
                    style={{
                      background: isActive ? `${color}18` : "#18181b",
                      border: `1px solid ${isActive ? `${color}40` : "#27272a"}`,
                      color: isActive ? color : "#52525b",
                    }}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-2">
              Reason <span className="text-zinc-700 normal-case font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why is this IOC worth monitoring?"
              className="w-full px-3 py-2 rounded-lg text-xs bg-zinc-900 border border-zinc-800 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-blue-500/40 transition-colors"
            />
          </div>

          {error && (
            <p className="text-xs text-red-400 px-3 py-2 rounded-lg" style={{ background: "#ef444415", border: "1px solid #ef444425" }}>
              {error}
            </p>
          )}

          <button
            onClick={doAdd}
            disabled={!selected || adding}
            className="w-full py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all mt-1"
            style={{
              background: !selected || adding ? "#27272a" : ACCENT,
              color: !selected || adding ? "#52525b" : "#09090b",
              cursor: !selected || adding ? "not-allowed" : "pointer",
            }}
          >
            <BookmarkSimple className="w-4 h-4" weight="fill" />
            {adding ? "Adding…" : "Add to Watchlist"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function WatchlistPage() {
  const [items, setItems]     = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
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
      <div className="min-h-screen" style={{ background: "#09090b", color: "#e4e4e7" }}>
        {/* ── Navbar ─────────────────────────────────────────────────────── */}
        <nav
          className="sticky top-0 z-40 h-14 flex items-center px-6 gap-4"
          style={{ background: "#09090b", borderBottom: "1px solid #1c1c20" }}
        >
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-4 h-4" weight="bold" />
            <span className="text-xs font-medium">Dashboard</span>
          </Link>

          <div className="h-4 w-px bg-zinc-800 shrink-0" />

          <div className="flex items-center gap-2">
            <BrandMark size={16} />
            <span className="font-bold text-sm tracking-tight">
              <span className="text-zinc-100">Priority</span>
              <span style={{ color: ACCENT }}> Watchlist</span>
            </span>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
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
          </div>
        </nav>

        <div className="max-w-5xl mx-auto px-6 py-6">
          {/* ── Summary cards ──────────────────────────────────────────── */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <SummaryCard
              label="Total Watching"
              value={items.length}
              color={ACCENT}
            />
            <SummaryCard
              label="High Priority"
              value={highCount}
              color={PRIORITY_COLORS.high}
            />
            <SummaryCard
              label="Critical Severity"
              value={criticalCount}
              color={SEVERITY_COLORS.critical ?? "#ef4444"}
            />
          </div>

          {/* ── Table ──────────────────────────────────────────────────── */}
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: "1px solid #27272a", background: "#111114" }}
          >
            {/* Header */}
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

          {/* High-priority section hint */}
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

      {/* Add Modal */}
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

function SummaryCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div
      className="rounded-xl px-5 py-4"
      style={{ background: "#111114", border: "1px solid #27272a" }}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">{label}</p>
      <p
        className="text-2xl font-black tabular-nums"
        style={{ color }}
      >
        {value}
      </p>
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
