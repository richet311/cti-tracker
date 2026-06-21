"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  XIcon as X,
  FileTextIcon as FileText,
  CircleNotchIcon as CircleNotch,
  ShieldIcon as Shield,
  ClockIcon as Clock,
  TagIcon as Tag,
} from "@phosphor-icons/react";
import { Report, BASE } from "@/lib/api";
import { authHeaders } from "@/lib/api/auth";

const TLP_STYLES: Record<string, { color: string; bg: string; border: string }> = {
  WHITE: { color: "#e2e8f0", bg: "#e2e8f010", border: "#e2e8f030" },
  GREEN: { color: "#00ff88", bg: "#00ff8810", border: "#00ff8830" },
  AMBER: { color: "#fbbf24", bg: "#fbbf2410", border: "#fbbf2430" },
  RED:   { color: "#ff4444", bg: "#ff444410", border: "#ff444430" },
};

const TYPE_LABELS: Record<string, string> = {
  tactical: "Tactical Report",
  flash:    "Flash Alert",
  summary:  "Summary",
};

interface Props {
  report: Report | null;
  onClose: () => void;
}

export function ReportDrawer({ report, onClose }: Props) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!report) { setContent(null); return; }
    setLoading(true);
    setContent(null);
    fetch(`${BASE}/api/reports/${report.id}`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((d: Report) => setContent(d.content ?? null))
      .catch(() => setContent(null))
      .finally(() => setLoading(false));
  }, [report?.id]);

  useEffect(() => {
    if (!report) return;
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [report, onClose]);

  const tlpKey = (report?.tlp ?? "").replace("TLP:", "").toUpperCase();
  const tlp    = TLP_STYLES[tlpKey] ?? TLP_STYLES.WHITE;

  return (
    <AnimatePresence>
      {report && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[150]"
            style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)" }}
            onClick={onClose}
          />

          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className="fixed right-0 inset-y-0 z-[160] flex flex-col"
            style={{ width: "min(700px, 100vw)", background: "#0c0c0f", borderLeft: "1px solid #1e1e24" }}
          >
            {/* Header */}
            <div
              className="flex items-start gap-3 px-6 py-5 shrink-0"
              style={{ borderBottom: "1px solid #1e1e24" }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                    style={{ color: tlp.color, background: tlp.bg, borderColor: tlp.border }}
                  >
                    TLP:{tlpKey}
                  </span>
                  <span className="text-[10px] text-zinc-600 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-full">
                    {TYPE_LABELS[report.report_type] ?? report.report_type}
                  </span>
                  {report.campaign_name && (
                    <div className="flex items-center gap-1 text-[11px] text-[#9f7aea]">
                      <Shield className="w-3 h-3" />
                      <span>{report.campaign_name}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-[11px] text-zinc-600 ml-auto">
                    <Clock className="w-3 h-3" />
                    <span className="font-mono">{report.created_at?.slice(0, 10)}</span>
                  </div>
                </div>
                <h2 className="text-zinc-100 font-semibold text-[15px] leading-snug">{report.title}</h2>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {loading ? (
                <div className="flex items-center gap-2 text-zinc-600 text-sm py-12">
                  <CircleNotch className="w-4 h-4 animate-spin" />
                  Loading report content…
                </div>
              ) : content ? (
                <MarkdownView content={content} />
              ) : (
                <div className="flex flex-col items-center py-16 gap-3">
                  <FileText className="w-10 h-10 text-zinc-800" />
                  <p className="text-zinc-600 text-sm">No content available for this report</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function inlineBold(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**")
          ? <strong key={i} className="text-zinc-200 font-semibold">{p.slice(2, -2)}</strong>
          : p
      )}
    </>
  );
}

function inlineCode(text: string): React.ReactNode {
  const parts = text.split(/(`[^`]+`)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("`") && p.endsWith("`")
          ? <code key={i} className="text-[12px] font-mono bg-zinc-900 text-[#00c8ff] px-1.5 py-0.5 rounded">{p.slice(1, -1)}</code>
          : inlineBold(p)
      )}
    </>
  );
}

function MarkdownView({ content }: { content: string }) {
  const lines = content.split("\n");

  return (
    <div>
      {lines.map((line, i) => {
        if (line.startsWith("# "))
          return (
            <h1 key={i} className="text-[17px] font-bold text-zinc-100 mt-0 mb-4 pb-3 first:mt-0"
              style={{ borderBottom: "1px solid #1e1e24" }}>
              {inlineCode(line.slice(2))}
            </h1>
          );
        if (line.startsWith("## "))
          return (
            <h2 key={i} className="text-[13px] font-bold text-zinc-300 mt-6 mb-3 uppercase tracking-wider">
              {inlineCode(line.slice(3))}
            </h2>
          );
        if (line.startsWith("### "))
          return (
            <h3 key={i} className="text-[13px] font-semibold text-zinc-400 mt-4 mb-2">
              {inlineCode(line.slice(4))}
            </h3>
          );
        if (line.startsWith("- ") || line.startsWith("* "))
          return (
            <div key={i} className="flex gap-2.5 text-[13px] text-zinc-400 leading-relaxed mb-1">
              <span className="text-zinc-700 shrink-0 mt-0.5 select-none">·</span>
              <span>{inlineCode(line.slice(2))}</span>
            </div>
          );
        if (/^-{3,}$/.test(line.trim()))
          return <hr key={i} className="border-zinc-800 my-5" />;
        if (line.trim() === "")
          return <div key={i} className="h-3" />;
        return (
          <p key={i} className="text-[13px] text-zinc-400 leading-relaxed mb-1">
            {inlineCode(line)}
          </p>
        );
      })}
    </div>
  );
}
