"use client";

import { IOC_TYPE_COLORS, SEVERITY_COLORS, SOURCE_COLORS } from "@/lib/api";

export const TYPE_LABELS: Record<string, string> = {
  hash_sha256: "SHA-256",
  hash_md5:    "MD5",
  hash_sha1:   "SHA-1",
  url:         "URL",
  ip:          "IP",
  domain:      "Domain",
};

const PRIORITY_COLORS = {
  high:   "#ef4444",
  medium: "#fbbf24",
  low:    "#94a3b8",
};

export function PriorityBadge({ priority }: { priority: "low" | "medium" | "high" }) {
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

export function SeverityBadge({ severity }: { severity: string }) {
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

export function TypeBadge({ iocType }: { iocType: string }) {
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

export function ConfidenceBar({ value }: { value: number }) {
  const color =
    value >= 85 ? "#ef4444" :
    value >= 70 ? "#f97316" :
    value >= 55 ? "#fbbf24" :
    "#94a3b8";
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 rounded-full bg-zinc-800 overflow-hidden shrink-0">
        <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="text-[11px] font-mono tabular-nums" style={{ color }}>{value}</span>
    </div>
  );
}

export function SourceTag({ source }: { source: string | null }) {
  if (!source) return <span className="text-zinc-600 text-xs">—</span>;
  const s = source.split(",")[0].trim();
  const color = SOURCE_COLORS[s] ?? "#64748b";
  return <span className="text-xs capitalize" style={{ color }}>{s}</span>;
}
