"use client";

import { motion } from "framer-motion";
import { FileText, Shield, Clock, Tag } from "lucide-react";
import { Report } from "@/lib/api";

interface Props {
  reports: Report[];
}

const TLP: Record<string, { label: string; color: string; bg: string; border: string }> = {
  WHITE: { label: "TLP:WHITE", color: "#e2e8f0", bg: "#e2e8f010", border: "#e2e8f030" },
  GREEN: { label: "TLP:GREEN", color: "#00ff88", bg: "#00ff8810", border: "#00ff8830" },
  AMBER: { label: "TLP:AMBER", color: "#fbbf24", bg: "#fbbf2410", border: "#fbbf2430" },
  RED:   { label: "TLP:RED",   color: "#ff4444", bg: "#ff444410", border: "#ff444430" },
};

const REPORT_TYPE_LABELS: Record<string, string> = {
  tactical: "Tactical Report",
  flash:    "Flash Alert",
  summary:  "Summary",
};

const ACCENT = "#00c8ff";

export default function ReportsView({ reports }: Props) {
  if (reports.length === 0) {
    return (
      <div className="card p-12 text-center">
        <FileText className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
        <p className="text-zinc-500 text-sm mb-1">No reports generated yet</p>
        <p className="text-zinc-400 dark:text-zinc-600 text-xs">
          Run{" "}
          <code className="text-zinc-600 dark:text-zinc-400 font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
            python main.py report generate
          </code>{" "}
          to produce your first intelligence report
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-zinc-600 dark:text-zinc-400 text-sm font-semibold uppercase tracking-widest">
          Intelligence Reports
        </h2>
        <span className="text-zinc-400 dark:text-zinc-500 text-xs">{reports.length} report{reports.length !== 1 ? "s" : ""}</span>
      </div>

      <div className="space-y-3">
        {reports.map((r, i) => {
          const tlp = TLP[r.tlp?.toUpperCase()] ?? TLP.WHITE;
          const typeLabel = REPORT_TYPE_LABELS[r.report_type] ?? r.report_type;

          return (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              className="card p-5 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="shrink-0 p-2.5 rounded-xl mt-0.5" style={{ background: `${ACCENT}10`, border: `1px solid ${ACCENT}20` }}>
                  <FileText className="w-5 h-5" style={{ color: ACCENT }} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h3 className="text-zinc-800 dark:text-zinc-200 font-semibold text-sm">{r.title}</h3>

                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0"
                      style={{
                        color: tlp.color,
                        background: tlp.bg,
                        borderColor: tlp.border,
                      }}
                    >
                      {tlp.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-zinc-400 dark:text-zinc-500 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <Tag className="w-3 h-3" />
                      <span>{typeLabel}</span>
                    </div>

                    {r.campaign_name && (
                      <div className="flex items-center gap-1.5">
                        <Shield className="w-3 h-3 text-[#9f7aea]" />
                        <span className="text-[#9f7aea]">{r.campaign_name}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 ml-auto">
                      <Clock className="w-3 h-3" />
                      <span className="font-mono">{r.created_at?.slice(0, 10) ?? "—"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
