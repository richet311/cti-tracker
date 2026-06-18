"use client";

import { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Terminal, CheckCircle } from "lucide-react";
import { FeedMessage, IOC_TYPE_COLORS, SOURCE_COLORS, truncate } from "@/lib/api";

const ACCENT = "#00c8ff";

const TYPE_LABELS: Record<string, string> = {
  hash_sha256: "SHA256",
  hash_md5: "MD5",
  hash_sha1: "SHA1",
  url: "URL",
  ip: "IP",
  domain: "DOMAIN",
};

const SOURCE_LABELS: Record<string, string> = {
  malwarebazaar: "MB",
  urlhaus: "UH",
  manual: "MAN",
  system: "SYS",
};

interface Props {
  messages: FeedMessage[];
  collecting: boolean;
  onCollect: () => void;
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function LiveFeed({ messages, collecting, onCollect }: Props) {
  const listRef = useRef<HTMLDivElement>(null);
  const iocCount = messages.filter((m) => m.type === "ioc").length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.4 }}
      className="flex flex-col overflow-hidden"
      style={{
        background: "#111114",
        border: "1px solid #27272a",
        borderRadius: 12,
        minHeight: 520,
      }}
    >
      {/* ── Window chrome ─────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-3 px-4 py-3 shrink-0"
        style={{ background: "#18181b", borderBottom: "1px solid #27272a" }}
      >
        {/* Traffic-light dots */}
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#3f3f46" }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#3f3f46" }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#3f3f46" }} />
        </div>

        {/* Title */}
        <div className="flex-1 flex items-center justify-center gap-2">
          <Terminal className="w-3.5 h-3.5" style={{ color: "#52525b" }} />
          <span className="text-[11px] font-mono" style={{ color: "#71717a" }}>
            threat-intel-collector
          </span>
          {collecting && (
            <motion.span
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ repeat: Infinity, duration: 1.2 }}
              className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded"
              style={{ color: ACCENT, background: `${ACCENT}15` }}
            >
              ● LIVE
            </motion.span>
          )}
        </div>

        {/* Collect button */}
        <button
          onClick={onCollect}
          disabled={collecting}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold font-mono transition-all"
          style={
            collecting
              ? { background: "#27272a", color: "#52525b", cursor: "not-allowed" }
              : { background: ACCENT, color: "#09090b" }
          }
        >
          <Play className="w-3 h-3" />
          {collecting ? "running..." : "collect"}
        </button>
      </div>

      {/* ── Prompt line ───────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-2 px-4 py-2 shrink-0"
        style={{ background: "#0e0e11", borderBottom: "1px solid #1a1a1e" }}
      >
        <span className="text-[11px] font-mono" style={{ color: "#3f3f46" }}>~/cti</span>
        <span className="text-[11px] font-mono" style={{ color: ACCENT, opacity: 0.5 }}>$</span>
        <span className="text-[11px] font-mono" style={{ color: "#52525b" }}>
          python main.py collect --limit 50
        </span>
        {iocCount > 0 && (
          <span className="ml-auto text-[10px] font-mono" style={{ color: "#3f3f46" }}>
            {iocCount} iocs captured
          </span>
        )}
      </div>

      {/* ── Column headers ─────────────────────────────────────────────── */}
      {messages.length > 0 && (
        <div
          className="flex items-center gap-3 px-4 py-1.5 shrink-0"
          style={{ background: "#0e0e11", borderBottom: "1px solid #1a1a1e" }}
        >
          <span className="text-[9px] font-mono font-bold uppercase tracking-widest shrink-0" style={{ color: "#3f3f46", width: 58 }}>TIME</span>
          <span className="text-[9px] font-mono font-bold uppercase tracking-widest shrink-0" style={{ color: "#3f3f46", minWidth: 56 }}>TYPE</span>
          <span className="text-[9px] font-mono font-bold uppercase tracking-widest flex-1" style={{ color: "#3f3f46" }}>VALUE</span>
          <span className="text-[9px] font-mono font-bold uppercase tracking-widest shrink-0" style={{ color: "#3f3f46" }}>SRC</span>
        </div>
      )}

      {/* ── Feed body ─────────────────────────────────────────────────── */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto"
        style={{ maxHeight: 360 }}
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-start justify-center h-full py-16 px-6 gap-1">
            <p className="text-[11px] font-mono" style={{ color: "#3f3f46" }}>
              <span style={{ color: ACCENT, opacity: 0.4 }}>$</span>{" "}
              <span>waiting for collection job...</span>
            </p>
            <p className="text-[11px] font-mono flex items-center gap-1" style={{ color: "#3f3f46" }}>
              <span style={{ color: ACCENT, opacity: 0.4 }}>$</span>
              <motion.span
                animate={{ opacity: [1, 0, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                style={{ color: ACCENT }}
              >
                ▌
              </motion.span>
            </p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.15 }}
            >
              {msg.type === "ioc" ? (
                <IOCRow msg={msg} />
              ) : msg.type === "complete" ? (
                <CompleteRow msg={msg} />
              ) : (
                <StatusRow msg={msg} />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ── Footer legend ─────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-4 py-2.5 shrink-0"
        style={{ background: "#18181b", borderTop: "1px solid #27272a" }}
      >
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-mono flex items-center gap-1.5" style={{ color: "#52525b" }}>
            <span style={{ color: SOURCE_COLORS.malwarebazaar }}>■</span>
            MalwareBazaar
          </span>
          <span className="text-[10px] font-mono flex items-center gap-1.5" style={{ color: "#52525b" }}>
            <span style={{ color: SOURCE_COLORS.urlhaus }}>■</span>
            URLhaus
          </span>
        </div>
        <span className="text-[10px] font-mono" style={{ color: "#3f3f46" }}>
          {iocCount > 0 ? `${iocCount} indicators` : "idle"}
        </span>
      </div>
    </motion.div>
  );
}

function IOCRow({ msg }: { msg: FeedMessage }) {
  const typeColor = IOC_TYPE_COLORS[msg.ioc_type ?? ""] ?? "#94a3b8";
  const srcColor = SOURCE_COLORS[msg.source] ?? "#52525b";

  return (
    <div
      className="flex items-center gap-3 px-4 py-1.5 text-[11px] hover:bg-white/[0.02] transition-colors"
      style={{
        borderBottom: "1px solid #1a1a1e",
        borderLeft: `2px solid ${srcColor}40`,
      }}
    >
      <span className="shrink-0 font-mono" style={{ color: "#3f3f46", width: 58 }}>
        {formatTime(msg.timestamp)}
      </span>

      <span
        className="shrink-0 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded text-center"
        style={{
          color: typeColor,
          background: `${typeColor}18`,
          border: `1px solid ${typeColor}30`,
          minWidth: 56,
        }}
      >
        {TYPE_LABELS[msg.ioc_type ?? ""] ?? msg.ioc_type}
      </span>

      <span className="flex-1 truncate font-mono" style={{ color: "#a1a1aa" }}>
        {truncate(msg.value ?? "", 50)}
      </span>

      <span
        className="shrink-0 text-[9px] font-bold font-mono"
        style={{ color: srcColor }}
      >
        {SOURCE_LABELS[msg.source] ?? msg.source}
      </span>
    </div>
  );
}

function StatusRow({ msg }: { msg: FeedMessage }) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-1.5 text-[11px]"
      style={{ borderBottom: "1px solid #1a1a1e" }}
    >
      <span className="font-mono" style={{ color: ACCENT, opacity: 0.35 }}>{">"}</span>
      <span className="font-mono" style={{ color: "#52525b" }}>
        {msg.message}
      </span>
    </div>
  );
}

function CompleteRow({ msg }: { msg: FeedMessage }) {
  return (
    <div
      className="flex items-center gap-2.5 px-4 py-2"
      style={{ background: "#00ff8806", borderBottom: "1px solid #00ff8815" }}
    >
      <CheckCircle className="w-3.5 h-3.5 shrink-0" style={{ color: "#00ff88" }} />
      <span className="text-[11px] font-mono font-semibold" style={{ color: "#00ff88" }}>
        {msg.message}
      </span>
    </div>
  );
}
