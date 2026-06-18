"use client";

import { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Wifi, WifiOff, CheckCircle, AlertCircle } from "lucide-react";
import {
  FeedMessage,
  IOC_TYPE_COLORS,
  SOURCE_COLORS,
  truncate,
} from "@/lib/api";

interface Props {
  messages: FeedMessage[];
  collecting: boolean;
  onCollect: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  hash_sha256: "SHA256",
  hash_md5: "MD5",
  hash_sha1: "SHA1",
  url: "URL",
  ip: "IP",
  domain: "DOM",
};

const ACCENT = "#00c8ff";

export default function LiveFeed({ messages, collecting, onCollect }: Props) {
  const listRef = useRef<HTMLDivElement>(null);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.4, duration: 0.4 }}
      className="card flex flex-col"
      style={{ minHeight: 480 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          {collecting ? (
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ repeat: Infinity, duration: 1.2 }}
              className="w-2 h-2 rounded-full"
              style={{ background: ACCENT }}
            />
          ) : (
            <div className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-600" />
          )}
          <h2 className="text-zinc-600 dark:text-zinc-400 text-sm font-semibold uppercase tracking-widest">
            Live Feed
          </h2>
          {collecting && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full" style={{ color: ACCENT, background: `${ACCENT}18` }}>
              LIVE
            </span>
          )}
        </div>

        <button
          onClick={onCollect}
          disabled={collecting}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            collecting
              ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed"
              : "hover:opacity-90 hover:scale-105 active:scale-95"
          }`}
          style={collecting ? undefined : { background: ACCENT, color: "#09090b" }}
        >
          {collecting ? (
            <>
              <Wifi className="w-3 h-3" />
              Collecting
            </>
          ) : (
            <>
              <Play className="w-3 h-3" />
              Collect Now
            </>
          )}
        </button>
      </div>

      {/* Feed */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto p-3 space-y-1"
        style={{ maxHeight: 400 }}
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 py-12 text-zinc-400 dark:text-zinc-600">
            <WifiOff className="w-8 h-8" />
            <span className="text-sm">Click &quot;Collect Now&quot; to start a live feed</span>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              {msg.type === "ioc" ? (
                <IOCEntry msg={msg} />
              ) : msg.type === "complete" ? (
                <CompleteEntry msg={msg} />
              ) : (
                <StatusEntry msg={msg} />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Footer count */}
      {messages.length > 0 && (
        <div className="px-5 py-3 border-t border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-600 text-xs">
          {messages.filter((m) => m.type === "ioc").length} indicators in feed
        </div>
      )}
    </motion.div>
  );
}

function IOCEntry({ msg }: { msg: FeedMessage }) {
  const typeColor = IOC_TYPE_COLORS[msg.ioc_type ?? ""] ?? "#94a3b8";
  const srcColor = SOURCE_COLORS[msg.source] ?? "#94a3b8";

  return (
    <div className="flex items-start gap-2 px-2 py-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors">
      <span
        className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded font-mono mt-0.5"
        style={{
          color: typeColor,
          background: `${typeColor}18`,
          border: `1px solid ${typeColor}30`,
        }}
      >
        {TYPE_LABELS[msg.ioc_type ?? ""] ?? msg.ioc_type}
      </span>

      <span className="ioc-value text-zinc-600 dark:text-zinc-300 flex-1 break-all leading-relaxed">
        {truncate(msg.value ?? "", 52)}
      </span>

      <span
        className="shrink-0 text-[9px] font-semibold mt-0.5"
        style={{ color: srcColor }}
      >
        {msg.source === "malwarebazaar" ? "MB" : msg.source === "urlhaus" ? "UH" : msg.source}
      </span>
    </div>
  );
}

function StatusEntry({ msg }: { msg: FeedMessage }) {
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 text-zinc-400 dark:text-zinc-500 text-xs">
      <AlertCircle className="w-3 h-3 shrink-0" />
      <span>{msg.message}</span>
    </div>
  );
}

function CompleteEntry({ msg }: { msg: FeedMessage }) {
  return (
    <div className="flex items-center gap-2 px-2 py-2 rounded-lg bg-[#00ff8808] border border-[#00ff8820] text-[#00ff88] text-xs font-semibold">
      <CheckCircle className="w-3.5 h-3.5 shrink-0" />
      {msg.message}
    </div>
  );
}
