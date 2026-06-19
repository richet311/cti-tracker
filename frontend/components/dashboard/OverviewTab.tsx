"use client";

import { motion } from "framer-motion";
import StatsCard from "@/components/StatsCard";
import IOCChart from "@/components/IOCChart";
import MalwareFamiliesChart from "@/components/MalwareFamiliesChart";
import { ThreatRadarMini } from "@/components/dashboard/ThreatRadarMini";
import {
  DatabaseIcon as Database,
  ShieldIcon as ShieldCheck,
  BookOpenIcon as BookOpen,
  GlobeHemisphereWestIcon as Globe,
} from "@phosphor-icons/react";
import type { Stats } from "@/lib/api";

const ACCENT = "#60a5fa";

const DATA_SOURCES = [
  { abbr: "MB",     name: "MalwareBazaar", color: "#00c8ff", desc: "Hash-based IOCs. SHA256, MD5, SHA1" },
  { abbr: "UH",     name: "URLhaus",        color: "#ff6b35", desc: "Malicious URLs and domains" },
  { abbr: "ATT&CK", name: "MITRE ATT&CK",  color: "#9f7aea", desc: "500+ adversary techniques" },
];

interface Props {
  stats: Stats | null;
  dark: boolean;
  collecting: boolean;
}

export function OverviewTab({ stats, dark, collecting }: Props) {
  return (
    <motion.div
      key="overview"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-5">
        <StatsCard
          title="Indicators"
          value={stats?.total_iocs ?? 0}
          icon={<Database className="w-4 h-4" weight="bold" />}
          subtitle="IOCs tracked"
          index={0}
        />
        <StatsCard
          title="Campaigns"
          value={stats?.total_campaigns ?? 0}
          icon={<ShieldCheck className="w-4 h-4" weight="bold" />}
          subtitle="Adversary clusters"
          index={1}
        />
        <StatsCard
          title="Reports"
          value={stats?.total_reports ?? 0}
          icon={<BookOpen className="w-4 h-4" weight="bold" />}
          subtitle="Intel reports"
          index={2}
        />
        <StatsCard
          title="Sources"
          value={2}
          icon={<Globe className="w-4 h-4" weight="bold" />}
          subtitle="MalwareBazaar · URLhaus"
          index={3}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
        <IOCChart data={stats?.ioc_types ?? []} dark={dark} />
        <MalwareFamiliesChart data={stats?.top_families ?? []} dark={dark} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {DATA_SOURCES.map((src, i) => (
          <motion.div
            key={src.name}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 + i * 0.06, duration: 0.35 }}
            className="relative overflow-hidden rounded-xl p-4"
            style={{ background: "#08080d", border: "1px solid #1a1a26" }}
          >
            <div
              className="absolute inset-x-0 top-0 h-[1px]"
              style={{ background: `linear-gradient(90deg, transparent, ${src.color}50, transparent)` }}
            />
            <div
              className="absolute top-0 right-0 w-20 h-20 pointer-events-none"
              style={{ background: `radial-gradient(circle at 100% 0%, ${src.color}09, transparent 65%)` }}
            />
            <div className="absolute pointer-events-none" style={{ top: 8, left: 8, width: 8, height: 8, borderTop: `1px solid ${src.color}40`, borderLeft: `1px solid ${src.color}40` }} />
            <div className="absolute pointer-events-none" style={{ top: 8, right: 8, width: 8, height: 8, borderTop: `1px solid ${src.color}40`, borderRight: `1px solid ${src.color}40` }} />
            <div className="absolute pointer-events-none" style={{ bottom: 8, left: 8, width: 8, height: 8, borderBottom: `1px solid ${src.color}40`, borderLeft: `1px solid ${src.color}40` }} />
            <div className="absolute pointer-events-none" style={{ bottom: 8, right: 8, width: 8, height: 8, borderBottom: `1px solid ${src.color}40`, borderRight: `1px solid ${src.color}40` }} />
            <div className="flex items-center justify-between mb-2 relative">
              <div className="flex items-center gap-2">
                <span
                  className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded"
                  style={{ color: src.color, background: `${src.color}15`, border: `1px solid ${src.color}28` }}
                >
                  {src.abbr}
                </span>
                <span className="text-[12px] font-medium" style={{ color: "#a1a1aa" }}>{src.name}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <motion.span
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ repeat: Infinity, duration: 2 + i * 0.4 }}
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: "#22c55e" }}
                />
                <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-wide">live</span>
              </div>
            </div>
            <p className="text-[10px] relative" style={{ color: "#52525b" }}>{src.desc}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.4 }}
        className="mt-3 grid grid-cols-1 lg:grid-cols-5 gap-3"
      >
        <div
          className="lg:col-span-2 relative overflow-hidden rounded-xl p-4 flex flex-col items-center"
          style={{ background: "#08080d", border: "1px solid #1a1a26" }}
        >
          <div className="absolute inset-x-0 top-0 h-[1px] pointer-events-none"
            style={{ background: `linear-gradient(90deg, transparent, ${ACCENT}40, transparent)` }} />
          <div className="absolute pointer-events-none" style={{ top: 10, left: 10, width: 10, height: 10, borderTop: `1px solid ${ACCENT}40`, borderLeft: `1px solid ${ACCENT}40` }} />
          <div className="absolute pointer-events-none" style={{ top: 10, right: 10, width: 10, height: 10, borderTop: `1px solid ${ACCENT}40`, borderRight: `1px solid ${ACCENT}40` }} />
          <div className="absolute pointer-events-none" style={{ bottom: 10, left: 10, width: 10, height: 10, borderBottom: `1px solid ${ACCENT}40`, borderLeft: `1px solid ${ACCENT}40` }} />
          <div className="absolute pointer-events-none" style={{ bottom: 10, right: 10, width: 10, height: 10, borderBottom: `1px solid ${ACCENT}40`, borderRight: `1px solid ${ACCENT}40` }} />
          <div className="flex items-center gap-2 self-start mb-3 relative">
            <span className="w-[2px] h-3 rounded-full" style={{ background: ACCENT }} />
            <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "#52525b" }}>
              Threat Radar
            </p>
            <motion.span
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ repeat: Infinity, duration: 1.4 }}
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: ACCENT }}
            />
          </div>
          <ThreatRadarMini size={200} />
        </div>

        <div
          className="lg:col-span-3 relative overflow-hidden rounded-xl p-5"
          style={{ background: "#08080d", border: "1px solid #1a1a26" }}
        >
          <div className="absolute inset-x-0 top-0 h-[1px] pointer-events-none"
            style={{ background: `linear-gradient(90deg, transparent, ${ACCENT}30, transparent)` }} />
          <div className="flex items-center gap-2 mb-4">
            <span className="w-[2px] h-3 rounded-full" style={{ background: ACCENT }} />
            <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "#52525b" }}>
              System Intelligence
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Collection Status", value: collecting ? "ACTIVE" : "STANDBY", color: collecting ? "#22c55e" : ACCENT, pulse: collecting },
              { label: "Active Feeds",      value: "02 / 02",  color: "#22c55e", pulse: true },
              { label: "IOC Coverage",      value: stats ? `${stats.total_iocs.toLocaleString()} IND` : "—", color: ACCENT, pulse: false },
              { label: "MITRE Techniques",  value: "500+",     color: "#9f7aea", pulse: false },
              { label: "TLP Levels",        value: "4 LEVELS", color: "#fbbf24", pulse: false },
              { label: "Threat Actors",     value: stats ? `${stats.total_campaigns}` : "—", color: "#ff6b35", pulse: false },
            ].map((row, i) => (
              <div
                key={row.label}
                className="relative rounded-lg p-3"
                style={{ background: "#0c0c14", border: "1px solid #18182a" }}
              >
                <p className="text-[10px] font-medium mb-1.5" style={{ color: "#52525b" }}>
                  {row.label}
                </p>
                <div className="flex items-center gap-1.5">
                  {row.pulse && (
                    <motion.span
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ repeat: Infinity, duration: 1.4, delay: i * 0.2 }}
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: row.color }}
                    />
                  )}
                  <span className="text-[13px] font-semibold font-mono" style={{ color: row.color }}>
                    {row.value}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
