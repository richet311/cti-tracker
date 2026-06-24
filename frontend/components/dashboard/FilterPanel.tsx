"use client";

import {
  FunnelIcon as Funnel,
  XCircleIcon as XCircle,
} from "@phosphor-icons/react";
import { SEVERITY_COLORS } from "@/lib/api";

const ACCENT = "#60a5fa";

const SEVERITY_ORDER = ["critical", "high", "medium", "low"];

export interface Filters {
  ioc_type: string;
  severity: string;
  source: string;
}

export const DEFAULT_FILTERS: Filters = {
  ioc_type: "",
  severity: "",
  source: "",
};

interface Props {
  filters: Filters;
  onChange: (f: Partial<Filters>) => void;
  onReset: () => void;
}

export function FilterPanel({ filters, onChange, onReset }: Props) {
  const hasActive = filters.ioc_type || filters.severity || filters.source;

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
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
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

    </div>
  );
}
