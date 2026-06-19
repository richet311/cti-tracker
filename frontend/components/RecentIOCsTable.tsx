"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  CaretLeftIcon as CaretLeft,
  CaretRightIcon as CaretRight,
  MagnifyingGlassIcon as MagnifyingGlass,
  XIcon as X,
} from "@phosphor-icons/react";
import { IOC, IOC_TYPE_COLORS, SEVERITY_COLORS, truncate } from "@/lib/api";

interface Props {
  iocs: IOC[];
}

const TYPE_LABELS: Record<string, string> = {
  hash_sha256: "SHA-256",
  hash_md5:    "MD5",
  hash_sha1:   "SHA-1",
  url:         "URL",
  ip:          "IP",
  domain:      "Domain",
};

const FILTER_PILLS = [
  { id: "all",         label: "All" },
  { id: "hash_sha256", label: "SHA-256" },
  { id: "hash_md5",    label: "MD5" },
  { id: "url",         label: "URL" },
  { id: "ip",          label: "IP" },
  { id: "domain",      label: "Domain" },
];

const ACCENT    = "#60a5fa";
const PAGE_SIZE = 15;

export default function RecentIOCsTable({ iocs }: Props) {
  const [page, setPage]           = useState(0);
  const [search, setSearch]       = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => { setPage(0); }, [search, typeFilter]);

  const filtered = iocs.filter((ioc) => {
    if (typeFilter !== "all" && ioc.ioc_type !== typeFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        ioc.value.toLowerCase().includes(q) ||
        (ioc.malware_family?.toLowerCase().includes(q) ?? false) ||
        (ioc.threat_type?.toLowerCase().includes(q) ?? false)
      );
    }
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const slice      = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="card"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
        <h2 className="text-zinc-600 dark:text-zinc-400 text-sm font-semibold uppercase tracking-widest">
          Indicators of Compromise
        </h2>
        <span className="text-zinc-400 dark:text-zinc-500 text-xs">
          {filtered.length !== iocs.length
            ? `${filtered.length} of ${iocs.length.toLocaleString()}`
            : `${iocs.length.toLocaleString()} total`}
        </span>
      </div>

      {/* Search + Filter bar */}
      <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <MagnifyingGlass
            className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500"
          />
          <input
            type="text"
            placeholder="Search by value, family, or threat"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-8 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-800 dark:text-zinc-300 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-blue-500/30 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors cursor-pointer"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {FILTER_PILLS.map((pill) => {
            const isActive = typeFilter === pill.id;
            const color = pill.id === "all" ? ACCENT : (IOC_TYPE_COLORS[pill.id] ?? "#94a3b8");
            return (
              <button
                key={pill.id}
                onClick={() => setTypeFilter(pill.id)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all font-medium cursor-pointer ${
                  isActive ? "" : "text-zinc-500 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600"
                }`}
                style={
                  isActive
                    ? { color, background: `${color}18`, borderColor: `${color}40` }
                    : undefined
                }
              >
                {pill.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-zinc-400 dark:text-zinc-500 text-xs uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-800">
              <th className="text-left px-6 py-3 font-medium">Type</th>
              <th className="text-left px-4 py-3 font-medium">Value</th>
              <th className="text-left px-4 py-3 font-medium">Family / Threat</th>
              <th className="text-left px-4 py-3 font-medium">Severity</th>
              <th className="text-left px-4 py-3 font-medium">Conf.</th>
              <th className="text-left px-4 py-3 font-medium">Source</th>
              <th className="text-left px-4 py-3 font-medium">First Seen</th>
            </tr>
          </thead>
          <tbody>
            {slice.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-14 text-center text-zinc-400 dark:text-zinc-600 text-sm">
                  {iocs.length === 0
                    ? <>No indicators yet. Click the <span className="text-zinc-600 dark:text-zinc-400 font-semibold">Live Feed</span> tab and hit Collect Now.</>

                    : "No indicators match your search"}
                </td>
              </tr>
            ) : (
              slice.map((ioc, i) => (
                <motion.tr
                  key={ioc.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.015 }}
                  className="border-b border-zinc-100 dark:border-zinc-800/60 hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-6 py-3">
                    <TypeBadge iocType={ioc.ioc_type} />
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="ioc-value text-zinc-700 dark:text-zinc-300 font-mono text-xs cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                      title={ioc.value}
                      onClick={() => navigator.clipboard.writeText(ioc.value)}
                    >
                      {truncate(ioc.value, 48)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {ioc.malware_family ? (
                      <span className="text-[#fbbf24] text-xs font-semibold">{ioc.malware_family}</span>
                    ) : ioc.threat_type ? (
                      <span className="text-[#ff6b35] text-xs">{ioc.threat_type}</span>
                    ) : (
                      <span className="text-zinc-300 dark:text-zinc-700 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <SeverityBadge severity={ioc.severity ?? "medium"} />
                  </td>
                  <td className="px-4 py-3">
                    <ConfidenceBar value={ioc.confidence ?? 50} />
                  </td>
                  <td className="px-4 py-3">
                    <SourceBadge source={ioc.source ?? "manual"} />
                  </td>
                  <td className="px-4 py-3 text-zinc-500 text-xs font-mono">
                    {ioc.first_seen?.slice(0, 10) ?? ioc.created_at?.slice(0, 10) ?? "—"}
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-200 dark:border-zinc-800">
          <span className="text-zinc-400 dark:text-zinc-500 text-xs">
            Page {page + 1} of {totalPages} &nbsp;·&nbsp;{" "}
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <CaretLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <CaretRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ── Badges ─────────────────────────────────────────────────────────────────────

function TypeBadge({ iocType }: { iocType: string }) {
  const color = IOC_TYPE_COLORS[iocType] ?? "#94a3b8";
  return (
    <span
      className="text-[10px] font-bold px-2 py-0.5 rounded font-mono"
      style={{ color, background: `${color}18`, border: `1px solid ${color}30` }}
    >
      {TYPE_LABELS[iocType] ?? iocType}
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

function ConfidenceBar({ value }: { value: number }) {
  const color =
    value >= 85 ? "#ef4444" :
    value >= 70 ? "#f97316" :
    value >= 55 ? "#fbbf24" :
    "#94a3b8";
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-12 h-1 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden shrink-0">
        <div
          className="h-full rounded-full"
          style={{ width: `${value}%`, background: color }}
        />
      </div>
      <span className="text-[11px] font-mono tabular-nums text-zinc-500">{value}</span>
    </div>
  );
}

function SourceBadge({ source }: { source: string }) {
  const colors: Record<string, string> = {
    malwarebazaar: "#00d4ff",
    urlhaus:       "#ff6b35",
    feodotracker:  "#ef4444",
    manual:        "#9f7aea",
  };
  const s = source.split(",")[0].trim();
  const c = colors[s] ?? "#64748b";
  return (
    <span className="text-xs capitalize" style={{ color: c }}>
      {s}
    </span>
  );
}
