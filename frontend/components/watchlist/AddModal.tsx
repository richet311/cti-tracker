"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  BookmarkSimpleIcon as BookmarkSimple,
  MagnifyingGlassIcon as MagnifyingGlass,
  XCircleIcon as XCircle,
} from "@phosphor-icons/react";
import { addToWatchlist, searchIOCs, IOC, truncate } from "@/lib/api";
import { TypeBadge, SeverityBadge } from "@/components/shared/badges";

const ACCENT = "#60a5fa";

const PRIORITY_COLORS = {
  high:   "#ef4444",
  medium: "#fbbf24",
  low:    "#94a3b8",
};

interface Props {
  onClose: () => void;
  onAdded: () => void;
}

export function AddModal({ onClose, onAdded }: Props) {
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
