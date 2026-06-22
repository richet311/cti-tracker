"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  XIcon as X,
  FileTextIcon as FileText,
  CircleNotchIcon as CircleNotch,
  ShieldIcon as Shield,
  ClockIcon as Clock,
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
                  <FileText className="w-10 h-10 text-zinc-600" />
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

// ── Inline renderer ───────────────────────────────────────────────────────────

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith("**") && p.endsWith("**"))
          return <strong key={i} className="text-zinc-200 font-semibold">{p.slice(2, -2)}</strong>;
        if (p.startsWith("`") && p.endsWith("`"))
          return <code key={i} className="text-[11px] font-mono bg-zinc-900 text-[#00c8ff] px-1.5 py-0.5 rounded">{p.slice(1, -1)}</code>;
        if (p.startsWith("*") && p.endsWith("*"))
          return <em key={i} className="text-zinc-500 italic">{p.slice(1, -1)}</em>;
        return p;
      })}
    </>
  );
}

// ── Markdown parser ───────────────────────────────────────────────────────────

type Seg =
  | { kind: "h1" | "h2" | "h3" | "hr" | "blank" | "bullet" | "para"; text: string }
  | { kind: "table"; header: string[]; rows: string[][] }
  | { kind: "code"; lines: string[] };

function parseContent(content: string): Seg[] {
  const rawLines = content.split("\n");
  const segs: Seg[] = [];
  let i = 0;

  const isSepRow = (l: string) => /^\|[\s\-|:]+\|$/.test(l.trim());

  while (i < rawLines.length) {
    const line = rawLines[i];

    if (line.trim().startsWith("```")) {
      const codeLines: string[] = [];
      i++;
      while (i < rawLines.length && !rawLines[i].trim().startsWith("```")) {
        codeLines.push(rawLines[i]);
        i++;
      }
      i++;
      segs.push({ kind: "code", lines: codeLines });
      continue;
    }

    if (line.startsWith("|")) {
      const tableLines: string[] = [];
      while (i < rawLines.length && rawLines[i].startsWith("|")) {
        tableLines.push(rawLines[i]);
        i++;
      }
      const dataLines = tableLines.filter((l) => !isSepRow(l));
      if (dataLines.length >= 2) {
        const header = dataLines[0].split("|").slice(1, -1).map((c) => c.trim());
        const rows   = dataLines.slice(1).map((l) => l.split("|").slice(1, -1).map((c) => c.trim()));
        segs.push({ kind: "table", header, rows });
      } else if (dataLines.length === 1) {
        segs.push({ kind: "para", text: dataLines[0] });
      }
      continue;
    }

    if (line.startsWith("# "))   { segs.push({ kind: "h1",    text: line.slice(2) });  i++; continue; }
    if (line.startsWith("## "))  { segs.push({ kind: "h2",    text: line.slice(3) });  i++; continue; }
    if (line.startsWith("### ")) { segs.push({ kind: "h3",    text: line.slice(4) });  i++; continue; }
    if (/^-{3,}$/.test(line.trim())) { segs.push({ kind: "hr",    text: "" });         i++; continue; }
    if (line.startsWith("- ") || line.startsWith("* ")) {
      segs.push({ kind: "bullet", text: line.slice(2) }); i++; continue;
    }
    if (line.trim() === "") { segs.push({ kind: "blank", text: "" }); i++; continue; }

    segs.push({ kind: "para", text: line });
    i++;
  }

  return segs;
}

// ── MarkdownView ──────────────────────────────────────────────────────────────

function MarkdownView({ content }: { content: string }) {
  const segs = parseContent(content);

  return (
    <div>
      {segs.map((seg, i) => {
        switch (seg.kind) {
          case "h1":
            return (
              <h1 key={i} className="text-[17px] font-bold text-zinc-100 mt-0 mb-4 pb-3 first:mt-0"
                style={{ borderBottom: "1px solid #1e1e24" }}>
                {renderInline(seg.text)}
              </h1>
            );
          case "h2":
            return (
              <h2 key={i} className="text-[13px] font-bold text-zinc-300 mt-6 mb-3 uppercase tracking-wider">
                {renderInline(seg.text)}
              </h2>
            );
          case "h3":
            return (
              <h3 key={i} className="text-[13px] font-semibold text-zinc-400 mt-4 mb-2">
                {renderInline(seg.text)}
              </h3>
            );
          case "hr":
            return <hr key={i} className="border-zinc-800 my-5" />;
          case "blank":
            return <div key={i} className="h-3" />;
          case "bullet":
            return (
              <div key={i} className="flex gap-2.5 text-[13px] text-zinc-400 leading-relaxed mb-1">
                <span className="text-zinc-700 shrink-0 mt-0.5 select-none">·</span>
                <span>{renderInline(seg.text)}</span>
              </div>
            );
          case "para":
            return (
              <p key={i} className="text-[13px] text-zinc-400 leading-relaxed mb-1">
                {renderInline(seg.text)}
              </p>
            );
          case "code":
            return (
              <div key={i} className="my-3 rounded-lg overflow-hidden">
                <pre
                  className="p-4 overflow-x-auto text-[11px] leading-relaxed font-mono text-zinc-300 whitespace-pre"
                  style={{ background: "#0e0e11", border: "1px solid #1e1e24" }}
                >
                  {seg.lines.join("\n")}
                </pre>
              </div>
            );
          case "table":
            return (
              <div key={i} className="overflow-x-auto my-4 rounded-lg" style={{ border: "1px solid #1e1e24" }}>
                <table className="w-full text-[12px] border-collapse">
                  <thead>
                    <tr style={{ background: "#111116", borderBottom: "1px solid #27272a" }}>
                      {seg.header.map((h, hi) => (
                        <th key={hi} className="text-left px-4 py-2.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                          {renderInline(h)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {seg.rows.map((row, ri) => (
                      <tr
                        key={ri}
                        className="hover:bg-white/[0.02] transition-colors"
                        style={{ borderBottom: ri < seg.rows.length - 1 ? "1px solid #1a1a1e" : "none" }}
                      >
                        {row.map((cell, ci) => (
                          <td key={ci} className="px-4 py-2.5 text-zinc-400 text-[12px]">
                            {renderInline(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
        }
      })}
    </div>
  );
}
