"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PlayIcon as Play,
  WifiHighIcon as WifiHigh,
  CheckCircleIcon as CheckCircle,
  ClockIcon as Clock,
} from "@phosphor-icons/react";
import { HelpTip } from "@/components/shared/HelpTip";
import { FeedMessage, IOC_TYPE_COLORS, SOURCE_COLORS, truncate } from "@/lib/api";

const ACCENT = "#60a5fa";

const TYPE_LABELS: Record<string, string> = {
  hash_sha256: "SHA256",
  hash_md5:   "MD5",
  hash_sha1:  "SHA1",
  url:        "URL",
  ip:         "IP",
  domain:     "DOMAIN",
};

const SOURCE_LABELS: Record<string, string> = {
  malwarebazaar: "MalwareBazaar",
  urlhaus:       "URLhaus",
  feodotracker:  "FeodoTracker",
  system:        "System",
};

const LIMIT_OPTIONS = [
  { value: 20,  label: "20 / src" },
  { value: 50,  label: "50 / src" },
  { value: 100, label: "100 / src" },
  { value: 200, label: "200 / src" },
];

interface Props {
  messages: FeedMessage[];
  collecting: boolean;
  onCollect: (limit: number) => void;
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
  const [limit, setLimit] = useState(20);
  const iocs    = messages.filter((m) => m.type === "ioc");
  const status  = messages.find((m) => m.type === "status" && m.source !== "system");
  const done    = messages.find((m) => m.type === "complete");

  return (
    <div
      className="flex flex-col overflow-hidden rounded-xl"
      style={{ background: "#111114", border: "1px solid #27272a", minHeight: 480 }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-5 py-3.5 shrink-0"
        style={{ borderBottom: "1px solid #1e1e22" }}
      >
        <WifiHigh
          className="w-4 h-4 shrink-0"
          style={{ color: collecting ? ACCENT : "#3f3f46" }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-[13px] font-semibold text-zinc-200">Live Collection</p>
            <HelpTip
              title="Live Collection"
              steps={[
                "Select how many indicators to pull per source using the dropdown.",
                'Click "Start Collection" to begin streaming via WebSocket.',
                "IOCs from MalwareBazaar, URLhaus, and FeodoTracker stream in real time.",
                "All collected indicators are saved to your database automatically.",
                'Switch to the "IOCs" tab to view and manage what was collected.',
              ]}
            />
          </div>
          <p className="text-[11px] text-zinc-600 mt-0.5">
            {collecting
              ? status?.message ?? "Fetching threat indicators..."
              : done
              ? done.new_count !== undefined
                ? `${done.total} processed — ${done.new_count} new, ${done.dup_count} already known`
                : `${iocs.length} indicators collected`
              : "Pull fresh IOCs from MalwareBazaar, URLhaus, and FeodoTracker"}
          </p>
        </div>

        {collecting && (
          <motion.div
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ repeat: Infinity, duration: 1.4 }}
            className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0"
            style={{ color: ACCENT, background: `${ACCENT}14`, border: `1px solid ${ACCENT}28` }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: ACCENT }} />
            LIVE
          </motion.div>
        )}

        {done && !collecting && (
          <div
            className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0"
            style={{ color: "#22c55e", background: "#22c55e14", border: "1px solid #22c55e28" }}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            Done
          </div>
        )}

        <select
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          disabled={collecting}
          className="text-[11px] font-mono rounded-lg px-2 py-1.5 shrink-0 cursor-pointer disabled:opacity-40"
          style={{ background: "#1c1c20", color: "#71717a", border: "1px solid #27272a" }}
        >
          {LIMIT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <button
          onClick={() => onCollect(limit)}
          disabled={collecting}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-semibold transition-all cursor-pointer shrink-0"
          style={
            collecting
              ? { background: "#1c1c20", color: "#3f3f46", cursor: "not-allowed" }
              : { background: ACCENT, color: "#09090b", boxShadow: `0 0 16px ${ACCENT}28` }
          }
        >
          <Play className="w-3 h-3" weight="bold" />
          {collecting ? "Running..." : "Run Collection"}
        </button>
      </div>

      {/* Source legend */}
      <div
        className="flex items-center gap-5 px-5 py-2 shrink-0"
        style={{ background: "#0e0e11", borderBottom: "1px solid #1a1a1e" }}
      >
        {(["malwarebazaar", "urlhaus", "feodotracker"] as const).map((src) => {
          const count = iocs.filter((m) => m.source === src).length;
          return (
            <div key={src} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: SOURCE_COLORS[src] ?? "#52525b" }} />
              <span className="text-[11px] text-zinc-500">{SOURCE_LABELS[src]}</span>
              {count > 0 && (
                <span className="text-[10px] font-mono font-semibold" style={{ color: SOURCE_COLORS[src] }}>
                  {count}
                </span>
              )}
            </div>
          );
        })}
        <span className="ml-auto text-[11px] text-zinc-600 tabular-nums">
          {iocs.length > 0 ? `${iocs.length} total` : ""}
        </span>
      </div>

      {/* Column headers */}
      {iocs.length > 0 && (
        <div
          className="grid gap-3 px-5 py-2 shrink-0 text-[9px] font-bold uppercase tracking-widest"
          style={{
            gridTemplateColumns: "64px 72px 1fr 120px 44px",
            color: "#3f3f46",
            borderBottom: "1px solid #1a1a1e",
            background: "#0e0e11",
          }}
        >
          <span>Time</span>
          <span>Type</span>
          <span>Value</span>
          <span>Source</span>
          <span>Status</span>
        </div>
      )}

      {/* Feed body */}
      <div ref={listRef} className="flex-1 overflow-y-auto" style={{ maxHeight: 340 }}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 py-20">
            <Clock className="w-8 h-8 text-zinc-700" />
            <p className="text-[13px] text-zinc-600">No collection run yet</p>
            <p className="text-[11px] text-zinc-700 text-center max-w-xs">
              Click <span className="text-zinc-500 font-medium">Run Collection</span> to pull the latest threat indicators from external feeds and store them in the database.
            </p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg) =>
            msg.type === "ioc" ? (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.12 }}
              >
                <IOCRow msg={msg} />
              </motion.div>
            ) : msg.type === "complete" ? (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <CompleteRow msg={msg} />
              </motion.div>
            ) : msg.type === "status" ? (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <StatusRow msg={msg} />
              </motion.div>
            ) : null
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function IOCRow({ msg }: { msg: FeedMessage }) {
  const typeColor = IOC_TYPE_COLORS[msg.ioc_type ?? ""] ?? "#94a3b8";
  const srcColor  = SOURCE_COLORS[msg.source] ?? "#52525b";
  const isNew     = msg.is_new !== false;

  return (
    <div
      className="grid gap-3 px-5 py-2 text-[11px] hover:bg-white/[0.02] transition-colors items-center"
      style={{
        gridTemplateColumns: "64px 72px 1fr 120px 44px",
        borderBottom: "1px solid #18181b",
        borderLeft: `2px solid ${isNew ? srcColor : "#27272a"}`,
        opacity: isNew ? 1 : 0.55,
      }}
    >
      <span className="font-mono text-zinc-600 shrink-0">{formatTime(msg.timestamp)}</span>

      <span
        className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded text-center shrink-0 w-fit"
        style={{
          color: typeColor,
          background: `${typeColor}18`,
          border: `1px solid ${typeColor}28`,
        }}
      >
        {TYPE_LABELS[msg.ioc_type ?? ""] ?? msg.ioc_type}
      </span>

      <span className="truncate font-mono text-zinc-400">
        {truncate(msg.value ?? "", 60)}
      </span>

      <span className="text-[11px] text-zinc-500 truncate">
        {SOURCE_LABELS[msg.source] ?? msg.source}
      </span>

      <span
        className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded text-center w-fit shrink-0"
        style={
          isNew
            ? { color: "#22c55e", background: "#22c55e14", border: "1px solid #22c55e28" }
            : { color: "#52525b", background: "#27272a40", border: "1px solid #3f3f46" }
        }
      >
        {isNew ? "NEW" : "DUP"}
      </span>
    </div>
  );
}

function StatusRow({ msg }: { msg: FeedMessage }) {
  return (
    <div
      className="flex items-center gap-2 px-5 py-2 text-[11px]"
      style={{ borderBottom: "1px solid #18181b" }}
    >
      <motion.span
        animate={{ opacity: [1, 0.3, 1] }}
        transition={{ repeat: Infinity, duration: 1.6 }}
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ background: SOURCE_COLORS[msg.source] ?? ACCENT }}
      />
      <span className="text-zinc-600">{msg.message}</span>
    </div>
  );
}

function CompleteRow({ msg }: { msg: FeedMessage }) {
  return (
    <div
      className="flex items-center gap-2.5 px-5 py-3"
      style={{ background: "#22c55e08", borderBottom: "1px solid #22c55e18" }}
    >
      <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500" />
      <span className="text-[12px] font-semibold text-emerald-500">{msg.message}</span>
      {msg.new_count !== undefined && (
        <span className="ml-auto flex items-center gap-2 text-[11px]">
          <span className="font-mono px-1.5 py-0.5 rounded" style={{ color: "#22c55e", background: "#22c55e14", border: "1px solid #22c55e28" }}>
            {msg.new_count} new
          </span>
          <span className="font-mono px-1.5 py-0.5 rounded" style={{ color: "#52525b", background: "#27272a40", border: "1px solid #3f3f46" }}>
            {msg.dup_count} updated
          </span>
        </span>
      )}
    </div>
  );
}
