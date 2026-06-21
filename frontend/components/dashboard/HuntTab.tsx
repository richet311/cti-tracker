"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MagnifyingGlassIcon as MagnifyingGlass,
  FunnelIcon as Funnel,
  ShieldWarningIcon as ShieldWarning,
  DownloadSimpleIcon as DownloadSimple,
  Spinner,
  ArrowClockwiseIcon as ArrowClockwise,
} from "@phosphor-icons/react";
import { searchIOCs, IOC, SEVERITY_COLORS, truncate } from "@/lib/api";
import { HelpTip } from "@/components/shared/HelpTip";
import { BASE } from "@/lib/api/constants";
import {
  SeverityBadge,
  TypeBadge,
  ConfidenceBar,
  SourceTag,
} from "@/components/shared/badges";
import { FilterPanel, Filters, DEFAULT_FILTERS } from "@/components/dashboard/FilterPanel";

const ACCENT = "#60a5fa";

export function HuntTab() {
  const [q, setQ]                     = useState("");
  const [filters, setFilters]         = useState<Filters>(DEFAULT_FILTERS);
  const [results, setResults]         = useState<IOC[]>([]);
  const [loading, setLoading]         = useState(false);
  const [searched, setSearched]       = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  const doSearch = useCallback(async () => {
    setLoading(true);
    setSearched(true);
    try {
      const data = await searchIOCs({
        q:              q.trim() || undefined,
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

  const criticalCount = results.filter((r) => r.severity === "critical").length;
  const highCount     = results.filter((r) => r.severity === "high").length;

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <h2 className="text-zinc-600 text-sm font-semibold uppercase tracking-widest">
            IOC Hunt
          </h2>
          <HelpTip
            title="IOC Hunt"
            steps={[
              "Type any value, hash, IP, domain, or keyword to search your IOC database.",
              "Use the filter panel to narrow by type, severity, source, or confidence score.",
              "Results update automatically as you type.",
              "Export matching results as STIX 2.1 (structured) or CSV (spreadsheet).",
            ]}
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.open(`${BASE}/api/export/stix`, "_blank")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200 transition-colors cursor-pointer"
          >
            <DownloadSimple className="w-3.5 h-3.5" />
            STIX 2.1
          </button>
          <button
            onClick={() => window.open(`${BASE}/api/export/csv`, "_blank")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200 transition-colors cursor-pointer"
          >
            <DownloadSimple className="w-3.5 h-3.5" />
            CSV
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div className="mb-5">
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
              color:      loading ? "#52525b" : "#09090b",
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

      <div className="flex gap-5">
        {/* Filter Panel */}
        <div className={`shrink-0 transition-all duration-200 ${showFilters ? "w-52" : "w-0 overflow-hidden"}`}>
          {showFilters && (
            <FilterPanel filters={filters} onChange={updateFilter} onReset={resetFilters} />
          )}
        </div>

        {/* Results */}
        <div className="flex-1 min-w-0">
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
  );
}

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
                <td className="px-5 py-3"><SeverityBadge severity={ioc.severity} /></td>
                <td className="px-4 py-3"><TypeBadge iocType={ioc.ioc_type} /></td>
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
                <td className="px-4 py-3"><ConfidenceBar value={ioc.confidence ?? 50} /></td>
                <td className="px-4 py-3"><SourceTag source={ioc.source} /></td>
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
