"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { motion } from "framer-motion";
import { IOC_TYPE_COLORS } from "@/lib/api";

const ACCENT = "#60a5fa";

interface Props {
  data: { ioc_type: string; cnt: number }[];
  dark?: boolean;
}

const LABEL_MAP: Record<string, string> = {
  hash_sha256: "SHA-256",
  hash_md5:    "MD5",
  hash_sha1:   "SHA-1",
  url:         "URL",
  ip:          "IP",
  domain:      "Domain",
  unknown:     "Unknown",
};

function HUDCorners() {
  const s = `1px solid ${ACCENT}35`;
  const sz = 12;
  const p  = 12;
  return (
    <>
      <div className="absolute pointer-events-none" style={{ top: p, left: p, width: sz, height: sz, borderTop: s, borderLeft: s }} />
      <div className="absolute pointer-events-none" style={{ top: p, right: p, width: sz, height: sz, borderTop: s, borderRight: s }} />
      <div className="absolute pointer-events-none" style={{ bottom: p, left: p, width: sz, height: sz, borderBottom: s, borderLeft: s }} />
      <div className="absolute pointer-events-none" style={{ bottom: p, right: p, width: sz, height: sz, borderBottom: s, borderRight: s }} />
    </>
  );
}

export default function IOCChart({ data, dark = true }: Props) {
  const chartData = data.map((d) => ({
    name:  LABEL_MAP[d.ioc_type] ?? d.ioc_type,
    value: d.cnt,
    color: IOC_TYPE_COLORS[d.ioc_type] ?? "#94a3b8",
  }));

  const legendColor  = dark ? "#3a3a4a" : "#71717a";
  const tooltipBg    = dark ? "#08080d" : "#f5f6fb";
  const tooltipBorder = dark ? "#1a1a26" : "#d0d2df";
  const tooltipText  = dark ? "#e4e4e7" : "#18181b";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="relative overflow-hidden rounded-xl p-6 flex flex-col"
      style={{ background: "#08080d", border: "1px solid #1a1a26" }}
    >
      {/* Top accent line */}
      <div
        className="absolute inset-x-0 top-0 h-[1px] pointer-events-none"
        style={{ background: `linear-gradient(90deg, transparent, ${ACCENT}45, transparent)` }}
      />
      <HUDCorners />

      {/* Section label */}
      <div className="flex items-center gap-2 mb-4">
        <span className="w-[2px] h-3.5 rounded-full" style={{ background: ACCENT }} />
        <h2 className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "#52525b" }}>
          IOC Type Breakdown
        </h2>
      </div>

      {chartData.length === 0 ? (
        <div className="flex-1 flex items-center justify-center py-12 text-[11px]" style={{ color: "#3f3f46" }}>
          No data yet. Run a collection job to populate.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: tooltipBg,
                border: `1px solid ${tooltipBorder}`,
                borderRadius: 8,
                fontSize: 12,
                color: tooltipText,
                fontFamily: "monospace",
              }}
              formatter={(val: number, name: string) => [val.toLocaleString(), name]}
            />
            <Legend
              iconType="circle"
              iconSize={6}
              formatter={(val) => (
                <span style={{ color: legendColor, fontSize: 11, fontFamily: "monospace" }}>{val}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </motion.div>
  );
}
