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

interface Props {
  data: { ioc_type: string; cnt: number }[];
  dark?: boolean;
}

const LABEL_MAP: Record<string, string> = {
  hash_sha256: "SHA-256",
  hash_md5: "MD5",
  hash_sha1: "SHA-1",
  url: "URL",
  ip: "IP",
  domain: "Domain",
  unknown: "Unknown",
};

export default function IOCChart({ data, dark = true }: Props) {
  const chartData = data.map((d) => ({
    name: LABEL_MAP[d.ioc_type] ?? d.ioc_type,
    value: d.cnt,
    color: IOC_TYPE_COLORS[d.ioc_type] ?? "#94a3b8",
  }));

  const legendColor = dark ? "#94a3b8" : "#52525b";
  const tooltipBg = dark ? "#111114" : "#ffffff";
  const tooltipBorder = dark ? "#27272a" : "#e4e4e7";
  const tooltipText = dark ? "#e4e4e7" : "#18181b";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="card p-6 flex flex-col"
    >
      <h2 className="text-zinc-600 dark:text-zinc-400 text-sm font-semibold uppercase tracking-widest mb-4">
        IOC Type Breakdown
      </h2>

      {chartData.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-zinc-400 dark:text-zinc-600 text-sm">
          No data yet — run collection first
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
                fontSize: 13,
                color: tooltipText,
              }}
              formatter={(val: number, name: string) => [val.toLocaleString(), name]}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              formatter={(val) => (
                <span style={{ color: legendColor, fontSize: 12 }}>{val}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </motion.div>
  );
}
