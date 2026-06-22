"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Shield,
  Clock,
  Tag,
  Trash,
  CircleNotch,
  ArrowSquareOut,
} from "@phosphor-icons/react";
import { Report, deleteReport } from "@/lib/api";
import { useConfirm } from "@/hooks/useConfirm";
import { useToast } from "@/hooks/useToast";
import { ReportDrawer } from "@/components/ReportDrawer";
import { HelpTip } from "@/components/shared/HelpTip";

function Tip({ label, children }: { label: string; children: React.ReactNode }) {
  const [visible, setHover] = useState(false);
  return (
    <div
      className="relative"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {children}
      {visible && (
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap text-[10px] font-medium px-2 py-1 rounded-md pointer-events-none z-50"
          style={{ background: "#1c1c20", color: "#a1a1aa", border: "1px solid #27272a" }}
        >
          {label}
        </div>
      )}
    </div>
  );
}

interface Props {
  reports: Report[];
  onRefresh: () => void;
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

export default function ReportsView({ reports, onRefresh }: Props) {
  const [viewing, setViewing] = useState<Report | null>(null);

  if (reports.length === 0) {
    return (
      <div className="card p-12 text-center">
        <FileText className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
        <p className="text-zinc-500 text-sm mb-1">No reports generated yet</p>
        <p className="text-zinc-400 dark:text-zinc-600 text-xs">
          Go to <span className="font-semibold text-zinc-500">Campaigns</span> and click{" "}
          <span className="font-semibold text-zinc-500">Generate Report</span> on any campaign card
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <h2 className="text-zinc-600 dark:text-zinc-400 text-sm font-semibold uppercase tracking-widest">
            Intelligence Reports
          </h2>
          <HelpTip
            title="Intelligence Reports"
            steps={[
              'Go to Campaigns and click "Generate Report" on any campaign card.',
              "Click the open icon on a report row to read the full formatted content.",
              "Reports include IOC blocklists, ATT&CK technique tables, and defensive recommendations.",
              "TLP classification controls how the report should be distributed.",
            ]}
          />
        </div>
        <span className="text-zinc-400 dark:text-zinc-500 text-xs">
          {reports.length} report{reports.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="space-y-3">
        {reports.map((r, i) => (
          <ReportItem key={r.id} report={r} index={i} onRefresh={onRefresh} onView={setViewing} />
        ))}
      </div>

      <ReportDrawer report={viewing} onClose={() => setViewing(null)} />
    </div>
  );
}

function ReportItem({
  report: r,
  index: i,
  onRefresh,
  onView,
}: {
  report: Report;
  index: number;
  onRefresh: () => void;
  onView: (r: Report) => void;
}) {
  const confirm             = useConfirm();
  const toast               = useToast();
  const [deleting, setDeleting] = useState(false);

  const tlp       = TLP[r.tlp?.toUpperCase()] ?? TLP.WHITE;
  const typeLabel = REPORT_TYPE_LABELS[r.report_type] ?? r.report_type;

  async function handleDelete() {
    const ok = await confirm({
      title: `Delete "${r.title}"?`,
      description: "This report will be permanently removed.",
    });
    if (!ok) return;
    setDeleting(true);
    try {
      await deleteReport(r.id);
      toast("Report deleted");
      onRefresh();
    } catch {
      toast("Failed to delete report", "error");
      setDeleting(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.05, duration: 0.3 }}
      className="card p-5 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          className="shrink-0 p-2.5 rounded-xl mt-0.5"
          style={{ background: `${ACCENT}10`, border: `1px solid ${ACCENT}20` }}
        >
          <FileText className="w-5 h-5" style={{ color: ACCENT }} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <h3 className="text-zinc-800 dark:text-zinc-200 font-semibold text-sm">{r.title}</h3>

            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0"
              style={{ color: tlp.color, background: tlp.bg, borderColor: tlp.border }}
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

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <Tip label="Open report">
            <button
              onClick={() => onView(r)}
              className="p-1.5 rounded-lg text-zinc-600 hover:text-[#00c8ff] hover:bg-[#00c8ff10] transition-colors cursor-pointer"
            >
              <ArrowSquareOut className="w-3.5 h-3.5" />
            </button>
          </Tip>
          <Tip label="Delete report">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-400/10 transition-colors cursor-pointer disabled:opacity-40"
            >
              {deleting
                ? <CircleNotch className="w-3.5 h-3.5 animate-spin" />
                : <Trash className="w-3.5 h-3.5" />
              }
            </button>
          </Tip>
        </div>
      </div>
    </motion.div>
  );
}
