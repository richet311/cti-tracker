"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  MagnifyingGlassIcon as MagnifyingGlass,
  FunnelIcon as Funnel,
  ArrowLeftIcon as ArrowLeft,
  XCircleIcon as XCircle,
  ShieldWarningIcon as ShieldWarning,
  DownloadSimpleIcon as DownloadSimple,
  BookmarkSimpleIcon as BookmarkSimple,
  Spinner,
  ArrowClockwiseIcon as ArrowClockwise,
} from "@phosphor-icons/react";
import {
  searchIOCs,
  IOC,
  IOC_TYPE_COLORS,
  SEVERITY_COLORS,
  SOURCE_COLORS,
  truncate,
} from "@/lib/api";

const ACCENT = "#60a5fa";
const BASE   = "http://localhost:8000";

// ── Constants ─────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  hash_sha256: "SHA-256",
  hash_md5:    "MD5",
  hash_sha1:   "SHA-1",
  url:         "URL",
  ip:          "IP",
  domain:      "Domain",
};

const SEVERITY_ORDER = ["critical", "high", "medium", "low"];

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

function ConfidenceBar({ value }: { value: number }) {
  const color =
    value >= 85 ? "#ef4444" :
    value >= 70 ? "#f97316" :
    value >= 55 ? "#fbbf24" :
    "#94a3b8";
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 rounded-full bg-zinc-800 overflow-hidden shrink-0">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${value}%`, background: color }}
        />
      </div>
      <span className="text-[11px] font-mono tabular-nums" style={{ color }}>{value}</span>
    </div>
  );
}

function SourceTag({ source }: { source: string | null }) {
  if (!source) return <span className="text-zinc-600 text-xs">—</span>;
  const s = source.split(",")[0].trim();
  const color = SOURCE_COLORS[s] ?? "#64748b";
  return <span className="text-xs capitalize" style={{ color }}>{s}</span>;
}

// ── Filter Panel ──────────────────────────────────────────────────────────────

interface Filters {
  ioc_type: string;
  severity: string;
  source: string;
  min_confidence: number;
}

function FilterPanel({
  filters,
  onChange,
  onReset,
}: {
  filters: Filters;
  onChange: (f: Partial<Filters>) => void;
  onReset: () => void;
}) {
  const hasActive =
    filters.ioc_type || filters.severity || filters.source || filters.min_confidence > 0;

  return (
    <div
      className="rounded-xl p-4 space-y-4"
      style={{ background: "#111114", border: "1px solid #27272a" }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Funnel className="w-3.5 h-3.5" style={{ color: ACCENT }} weight="bold" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Filters</span>
        </div>
        {hasActive && (
          <button
            onClick={onReset}
            className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer flex items-center gap-1"
          >
            <XCircle className="w-3 h-3" />
            Reset
          </button>
        )}
      </div>

      {/* IOC Type */}
      <div>
        <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-600 mb-2">
          IOC Type
        </label>
        <select
          value={filters.ioc_type}
          onChange={(e) => onChange({ ioc_type: e.target.value })}
          className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-zinc-900 border border-zinc-800 text-zinc-300 focus:outline-none focus:border-blue-500/40 transition-colors cursor-pointer"
        >
          <option value="">All types</option>
          <option value="hash_sha256">SHA-256</option>
          <option value="hash_md5">MD5</option>
          <option value="hash_sha1">SHA-1</option>
          <option value="ip">IP Address</option>
          <option value="domain">Domain</option>
          <option value="url">URL</option>
        </select>
      </div>

      {/* Severity */}
      <div>
        <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-600 mb-2">
          Severity
        </label>
        <div className="space-y-1">
          {["", ...SEVERITY_ORDER].map((sev) => {
            const isActive = filters.severity === sev;
            const color = sev ? (SEVERITY_COLORS[sev] ?? "#94a3b8") : "#52525b";
            return (
              <button
                key={sev || "all"}
                onClick={() => onChange({ severity: sev })}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer text-left"
                style={{
                  background: isActive ? `${color}15` : "transparent",
                  border: `1px solid ${isActive ? `${color}35` : "transparent"}`,
                  color: isActive ? color : "#52525b",
                }}
              >
                {sev ? (
                  <>
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: color }}
                    />
                    <span className="capitalize font-medium">{sev}</span>
                  </>
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-zinc-600" />
                    <span className="font-medium">All severities</span>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Source */}
      <div>
        <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-600 mb-2">
          Source
        </label>
        <select
          value={filters.source}
          onChange={(e) => onChange({ source: e.target.value })}
          className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-zinc-900 border border-zinc-800 text-zinc-300 focus:outline-none focus:border-blue-500/40 transition-colors cursor-pointer"
        >
          <option value="">All sources</option>
          <option value="malwarebazaar">MalwareBazaar</option>
          <option value="urlhaus">URLhaus</option>
          <option value="feodotracker">FeodoTracker</option>
          <option value="manual">Manual</option>
        </select>
      </div>

      {/* Min Confidence */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
            Min Confidence
          </label>
          <span className="text-[11px] font-mono tabular-nums" style={{ color: ACCENT }}>
            {filters.min_confidence}
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={95}
          step={5}
          value={filters.min_confidence}
          onChange={(e) => onChange({ min_confidence: Number(e.target.value) })}
          className="w-full accent-blue-400 cursor-pointer"
        />
        <div className="flex justify-between text-[9px] text-zinc-700 mt-1">
          <span>0</span>
          <span>50</span>
          <span>95</span>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const DEFAULT_FILTERS: Filters = {
  ioc_type: "",
  severity: "",
  source: "",
  min_confidence: 0,
};

export default function HuntPage() {
  const [q, setQ]                   = useState("");
  const [filters, setFilters]       = useState<Filters>(DEFAULT_FILTERS);
  const [results, setResults]       = useState<IOC[]>([]);
  const [loading, setLoading]       = useState(false);
  const [searched, setSearched]     = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  const doSearch = useCallback(async () => {
    setLoading(true);
    setSearched(true);
    try {
      const data = await searchIOCs({
        q: q.trim() || undefined,
        ioc_type:       filters.ioc_type || undefined,
        severity:       filters.severity || undefined,
        source:         filters.source || undefined,
        min_confidence: filters.min_confidence || undefined,
        limit: 200,
      });
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [q, filters]);

  // Auto-search when filters change (debounced for confidence slider)
  useEffect(() => {
    if (!searched && !q && !filters.ioc_type && !filters.severity && !filters.source && !filters.min_confidence)
      return;
    const t = setTimeout(doSearch, 300);
    return () => clearTimeout(t);
  }, [filters, doSearch, searched, q]);

  function updateFilter(patch: Partial<Filters>) {
    setFilters((f) => ({ ...f, ...patch }));
  }

  function resetFilters() {
    setFilters(DEFAULT_FILTERS);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") doSearch();
  }

  function exportCSV() {
    window.open(`${BASE}/api/export/csv`, "_blank");
  }

  function exportSTIX() {
    window.open(`${BASE}/api/export/stix`, "_blank");
  }

  const criticalCount = results.filter((r) => r.severity === "critical").length;
  const highCount     = results.filter((r) => r.severity === "high").length;

  return (
    <div className="min-h-screen" style={{ background: "#09090b", color: "#e4e4e7" }}>
      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
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
            <span className="text-zinc-100">IOC</span>
            <span style={{ color: ACCENT }}> Hunt</span>
          </span>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          <button
            onClick={exportSTIX}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200 transition-colors cursor-pointer"
          >
            <DownloadSimple className="w-3.5 h-3.5" />
            STIX 2.1
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200 transition-colors cursor-pointer"
          >
            <DownloadSimple className="w-3.5 h-3.5" />
            CSV
          </button>
          <Link
            href="/watchlist"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200 transition-colors cursor-pointer"
          >
            <BookmarkSimple className="w-3.5 h-3.5" />
            Watchlist
          </Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* ── Search bar ─────────────────────────────────────────────────── */}
        <div className="mb-6">
          <div className="relative">
            <MagnifyingGlass
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
              style={{ color: "#52525b" }}
              weight="bold"
            />
            <input
              ref={inputRef}
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search by IOC value, malware family, or threat type…"
              className="w-full pl-12 pr-32 py-3.5 rounded-xl text-sm bg-zinc-900 border border-zinc-800 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-blue-500/40 transition-colors"
            />
            <button
              onClick={doSearch}
              disabled={loading}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2"
              style={{
                background: loading ? "#27272a" : ACCENT,
                color: loading ? "#52525b" : "#09090b",
              }}
            >
              {loading
                ? <Spinner className="w-3.5 h-3.5 animate-spin" />
                : <MagnifyingGlass className="w-3.5 h-3.5" weight="bold" />
              }
              {loading ? "Searching…" : "Search"}
            </button>
          </div>
          <p className="text-[11px] text-zinc-600 mt-2 px-1">
            Press Enter or click Search · Filters auto-apply as you change them · Up to 200 results
          </p>
        </div>

        <div className="flex gap-6">
          {/* ── Filter Panel ───────────────────────────────────────────── */}
          <div className={`shrink-0 transition-all duration-200 ${showFilters ? "w-52" : "w-0 overflow-hidden"}`}>
            {showFilters && (
              <FilterPanel filters={filters} onChange={updateFilter} onReset={resetFilters} />
            )}
          </div>

          {/* ── Results ────────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">
            {/* Results header */}
            {searched && (
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowFilters((s) => !s)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-colors cursor-pointer"
                  >
                    <Funnel className="w-3 h-3" />
                    {showFilters ? "Hide" : "Show"} filters
                  </button>

                  {!loading && (
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <span className="font-semibold text-zinc-300">{results.length}</span>
                      {results.length === 1 ? "result" : "results"}
                      {criticalCount > 0 && (
                        <span className="flex items-center gap-1 ml-1" style={{ color: SEVERITY_COLORS.critical }}>
                          <ShieldWarning className="w-3.5 h-3.5" weight="fill" />
                          {criticalCount} critical
                        </span>
                      )}
                      {highCount > 0 && (
                        <span className="flex items-center gap-1" style={{ color: SEVERITY_COLORS.high }}>
                          {highCount} high
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <button
                  onClick={doSearch}
                  className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                >
                  <ArrowClockwise className="w-3.5 h-3.5" />
                  Refresh
                </button>
              </div>
            )}

            {/* Table */}
            <div
              className="rounded-xl overflow-hidden"
              style={{ border: "1px solid #27272a", background: "#111114" }}
            >
              {!searched ? (
                <EmptySearch onSearch={doSearch} />
              ) : loading ? (
                <LoadingRows />
              ) : results.length === 0 ? (
                <NoResults onReset={() => { setQ(""); resetFilters(); }} />
              ) : (
                <ResultsTable iocs={results} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function EmptySearch({ onSearch }: { onSearch: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
        style={{ background: `${ACCENT}12`, border: `1px solid ${ACCENT}25` }}
      >
        <MagnifyingGlass className="w-6 h-6" style={{ color: ACCENT }} weight="bold" />
      </div>
      <p className="text-zinc-400 font-medium text-sm mb-1">Pivot on any indicator</p>
      <p className="text-zinc-600 text-xs max-w-xs leading-relaxed mb-4">
        Search by IOC value, malware family, or threat type.
        Apply filters to narrow by type, severity, source, or confidence threshold.
      </p>
      <button
        onClick={onSearch}
        className="px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all"
        style={{ background: `${ACCENT}18`, color: ACCENT, border: `1px solid ${ACCENT}30` }}
      >
        Load all IOCs
      </button>
    </div>
  );
}

function LoadingRows() {
  return (
    <div className="divide-y divide-zinc-800/60">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-3 animate-pulse">
          <div className="w-14 h-5 rounded bg-zinc-800" />
          <div className="flex-1 h-4 rounded bg-zinc-800" />
          <div className="w-24 h-4 rounded bg-zinc-800" />
          <div className="w-16 h-4 rounded bg-zinc-800" />
          <div className="w-20 h-4 rounded bg-zinc-800" />
        </div>
      ))}
    </div>
  );
}

function NoResults({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-zinc-500 text-sm mb-1">No indicators found</p>
      <p className="text-zinc-600 text-xs mb-4">Try broadening your search or adjusting filters</p>
      <button
        onClick={onReset}
        className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer underline underline-offset-2"
      >
        Clear all filters
      </button>
    </div>
  );
}

function ResultsTable({ iocs }: { iocs: IOC[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr
            className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500"
            style={{ borderBottom: "1px solid #27272a", background: "#0e0e12" }}
          >
            <th className="text-left px-5 py-3">Severity</th>
            <th className="text-left px-4 py-3">Type</th>
            <th className="text-left px-4 py-3">Value</th>
            <th className="text-left px-4 py-3">Family / Threat</th>
            <th className="text-left px-4 py-3">Confidence</th>
            <th className="text-left px-4 py-3">Source</th>
            <th className="text-left px-4 py-3">First Seen</th>
          </tr>
        </thead>
        <tbody>
          <AnimatePresence initial={false}>
            {iocs.map((ioc, i) => (
              <motion.tr
                key={ioc.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: Math.min(i * 0.01, 0.15) }}
                className="border-b border-zinc-800/50 hover:bg-white/[0.02] transition-colors"
              >
                <td className="px-5 py-3">
                  <SeverityBadge severity={ioc.severity} />
                </td>
                <td className="px-4 py-3">
                  <TypeBadge iocType={ioc.ioc_type} />
                </td>
                <td className="px-4 py-3">
                  <span
                    className="font-mono text-[12px] text-zinc-300 cursor-pointer hover:text-zinc-100 transition-colors"
                    title={ioc.value}
                    onClick={() => navigator.clipboard.writeText(ioc.value)}
                  >
                    {truncate(ioc.value, 52)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {ioc.malware_family ? (
                    <span className="text-[#fbbf24] text-xs font-semibold">{ioc.malware_family}</span>
                  ) : ioc.threat_type ? (
                    <span className="text-[#ff6b35] text-xs">{ioc.threat_type}</span>
                  ) : (
                    <span className="text-zinc-700 text-xs">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <ConfidenceBar value={ioc.confidence ?? 50} />
                </td>
                <td className="px-4 py-3">
                  <SourceTag source={ioc.source} />
                </td>
                <td className="px-4 py-3 text-zinc-500 text-xs font-mono">
                  {ioc.first_seen?.slice(0, 10) ?? ioc.created_at?.slice(0, 10) ?? "—"}
                </td>
              </motion.tr>
            ))}
          </AnimatePresence>
        </tbody>
      </table>
    </div>
  );
}
