"use client";

import { motion } from "framer-motion";

const SEVERITY_CONFIG: Record<string, { color: string }> = {
  critical: { color: "#ef4444" },
  high:     { color: "#f97316" },
  medium:   { color: "#60a5fa" },
  low:      { color: "#22c55e" },
};

const ORDER = ["critical", "high", "medium", "low"];
const R = 68, SW = 14, SIZE = 180;
const C = 2 * Math.PI * R;

interface SeverityCount { severity: string; cnt: number; }

export function SeverityRing({ data, total }: { data: SeverityCount[]; total: number }) {
  const map: Record<string, number> = {};
  for (const d of data) map[d.severity] = Number(d.cnt);

  let acc = 0;
  const segments = ORDER
    .filter((k) => (map[k] ?? 0) > 0)
    .map((key) => {
      const count = map[key] ?? 0;
      const length = (count / total) * C - 2;
      const seg = { key, count, length: Math.max(0, length), offset: acc };
      acc += (count / total) * C;
      return seg;
    });

  if (!total) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-2"
        style={{ width: SIZE, height: SIZE }}
      >
        <div
          className="w-24 h-24 rounded-full border-[10px] flex items-center justify-center"
          style={{ borderColor: "#1c1c24" }}
        />
        <p className="text-[11px] text-zinc-600">No data yet</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} style={{ transform: "rotate(-90deg)" }}>
          {/* Track */}
          <circle
            cx={SIZE / 2} cy={SIZE / 2} r={R}
            fill="none" stroke="#1c1c24" strokeWidth={SW}
          />
          {/* Segments */}
          {segments.map((seg, i) => (
            <motion.circle
              key={seg.key}
              cx={SIZE / 2} cy={SIZE / 2} r={R}
              fill="none"
              stroke={SEVERITY_CONFIG[seg.key]?.color ?? "#60a5fa"}
              strokeWidth={SW}
              strokeDasharray={`${seg.length} ${C}`}
              strokeDashoffset={-seg.offset}
              strokeLinecap="butt"
              initial={{ strokeDasharray: `0 ${C}` }}
              animate={{ strokeDasharray: `${seg.length} ${C}` }}
              transition={{ duration: 0.7, delay: 0.15 + i * 0.08 }}
            />
          ))}
        </svg>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[22px] font-bold font-mono text-zinc-100 leading-none">
            {total.toLocaleString()}
          </span>
          <span className="text-[9px] font-medium text-zinc-600 uppercase tracking-[0.15em] mt-1">
            IOCs
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 w-full px-2">
        {ORDER.filter((k) => (map[k] ?? 0) > 0).map((key) => (
          <div key={key} className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ background: SEVERITY_CONFIG[key].color }}
            />
            <span className="text-[11px] text-zinc-500 capitalize">{key}</span>
            <span
              className="ml-auto text-[11px] font-mono font-semibold"
              style={{ color: SEVERITY_CONFIG[key].color }}
            >
              {map[key]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
