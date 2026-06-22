"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CaretLeftIcon as CaretLeft,
  CaretRightIcon as CaretRight,
  MagnifyingGlassIcon as MagnifyingGlass,
  XIcon as X,
  CheckCircleIcon as CheckCircle,
  CircleNotchIcon as CircleNotch,
  ShieldCheckeredIcon as ShieldCheckered,
  TrashIcon as Trash,
  ArrowSquareOutIcon as ArrowSquareOut,
  DownloadSimpleIcon as DownloadSimple,
} from "@phosphor-icons/react";
import { IOC, IOC_TYPE_COLORS, SEVERITY_COLORS, truncate, Campaign, assignIocToCampaign, deleteIoc, BASE } from "@/lib/api";
import { useConfirm } from "@/hooks/useConfirm";
import { useToast } from "@/hooks/useToast";
import { HelpTip } from "@/components/shared/HelpTip";

interface Props {
  iocs: IOC[];
  campaigns: Campaign[];
  onRefresh: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  hash_sha256: "SHA-256",
  hash_md5:    "MD5",
  hash_sha1:   "SHA-1",
  url:         "URL",
  ip:          "IP",
  domain:      "Domain",
};

const FILTER_PILLS = [
  { id: "all",         label: "All" },
  { id: "hash_sha256", label: "SHA-256" },
  { id: "hash_md5",    label: "MD5" },
  { id: "url",         label: "URL" },
  { id: "ip",          label: "IP" },
  { id: "domain",      label: "Domain" },
];

const ACCENT    = "#60a5fa";
const PAGE_SIZE = 15;

export default function RecentIOCsTable({ iocs, campaigns, onRefresh }: Props) {
  const [page, setPage]                   = useState(0);
  const [search, setSearch]               = useState("");
  const [typeFilter, setTypeFilter]       = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [selectedIds, setSelectedIds]     = useState<Set<number>>(new Set());
  const confirm = useConfirm();
  const toast   = useToast();
  const [bulkCampaignId, setBulkCampaignId] = useState<string>("");
  const [bulkAssigning, setBulkAssigning]   = useState(false);
  const [bulkResult, setBulkResult]         = useState<{ ok: boolean; text: string } | null>(null);
  const [bulkDeleting, setBulkDeleting]     = useState(false);
  const selectAllRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setPage(0); setSelectedIds(new Set()); }, [search, typeFilter, severityFilter]);

  const filtered = iocs.filter((ioc) => {
    if (typeFilter !== "all" && ioc.ioc_type !== typeFilter) return false;
    if (severityFilter !== "all" && ioc.severity !== severityFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        ioc.value.toLowerCase().includes(q) ||
        (ioc.malware_family?.toLowerCase().includes(q) ?? false) ||
        (ioc.threat_type?.toLowerCase().includes(q) ?? false)
      );
    }
    return true;
  });

  const totalPages       = Math.ceil(filtered.length / PAGE_SIZE);
  const slice            = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const filteredIds      = filtered.map((ioc) => ioc.id);
  const allFilterSelected  = filteredIds.length > 0 && filteredIds.every((id) => selectedIds.has(id));
  const someFilterSelected = filteredIds.some((id) => selectedIds.has(id));

  // Drive the indeterminate state on the select-all checkbox
  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someFilterSelected && !allFilterSelected;
    }
  }, [someFilterSelected, allFilterSelected]);

  function toggleSelectAll() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allFilterSelected) {
        filteredIds.forEach((id) => next.delete(id));
      } else {
        filteredIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }

  const toggleRow = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  async function handleBulkAssign() {
    if (!bulkCampaignId || selectedIds.size === 0) return;
    setBulkAssigning(true);
    setBulkResult(null);
    const ids = Array.from(selectedIds);
    const results = await Promise.allSettled(
      ids.map((id) => assignIocToCampaign(Number(bulkCampaignId), id))
    );
    const failed = results.filter((r) => r.status === "rejected").length;
    setBulkAssigning(false);
    const result = failed === 0
      ? { ok: true,  text: `${ids.length} IOC${ids.length !== 1 ? "s" : ""} assigned` }
      : { ok: false, text: `${ids.length - failed} assigned, ${failed} failed` };
    setBulkResult(result);
    toast(result.text, result.ok ? "success" : "error");
    setSelectedIds(new Set());
    setBulkCampaignId("");
    setTimeout(() => setBulkResult(null), 3000);
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    const ok = await confirm({
      title: `Delete ${count} IOC${count !== 1 ? "s" : ""}?`,
      description: "Selected indicators will be permanently removed from the database.",
    });
    if (!ok) return;
    setBulkDeleting(true);
    setBulkResult(null);
    const ids = Array.from(selectedIds);
    const results = await Promise.allSettled(ids.map((id) => deleteIoc(id)));
    const failed = results.filter((r) => r.status === "rejected").length;
    setBulkDeleting(false);
    const result = failed === 0
      ? { ok: true,  text: `${ids.length} IOC${ids.length !== 1 ? "s" : ""} deleted` }
      : { ok: false, text: `${ids.length - failed} deleted, ${failed} failed` };
    setBulkResult(result);
    toast(result.text, result.ok ? "success" : "error");
    setSelectedIds(new Set());
    onRefresh();
    setTimeout(() => setBulkResult(null), 3000);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="card"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <h2 className="text-zinc-600 dark:text-zinc-400 text-sm font-semibold uppercase tracking-widest">
            Indicators of Compromise
          </h2>
          <HelpTip
            title="Indicators of Compromise"
            steps={[
              'Go to "Live Feed" and click "Start Collection" to pull fresh IOCs from threat feeds.',
              "Use the type pills and severity dropdown to filter the list.",
              "Check rows, then use the campaign dropdown and \"Assign\" to group IOCs.",
              "Click the VirusTotal icon on any row to pivot to external enrichment.",
              "Use \"Export CSV\" to download all IOCs for offline analysis.",
            ]}
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-zinc-400 dark:text-zinc-500 text-xs">
            {filtered.length !== iocs.length
              ? `${filtered.length} of ${iocs.length.toLocaleString()}`
              : `${iocs.length.toLocaleString()} total`}
          </span>
          <a
            href={`${BASE}/api/export/csv?limit=5000`}
            download="cti_iocs.csv"
            className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition-all"
            style={{ color: "#00c8ff", background: "#00c8ff0e", border: "1px solid #00c8ff22" }}
          >
            <DownloadSimple className="w-3.5 h-3.5" />
            Export CSV
          </a>
        </div>
      </div>

      {/* Search + Filter bar */}
      <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
          <input
            type="text"
            placeholder="Search by value, family, or threat"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-8 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-800 dark:text-zinc-300 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-blue-500/30 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {FILTER_PILLS.map((pill) => {
            const isActive = typeFilter === pill.id;
            const color = pill.id === "all" ? ACCENT : (IOC_TYPE_COLORS[pill.id] ?? "#94a3b8");
            return (
              <button
                key={pill.id}
                onClick={() => setTypeFilter(pill.id)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all font-medium cursor-pointer ${
                  isActive ? "" : "text-zinc-500 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600"
                }`}
                style={isActive ? { color, background: `${color}18`, borderColor: `${color}40` } : undefined}
              >
                {pill.label}
              </button>
            );
          })}

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-full border cursor-pointer transition-colors"
            style={{
              background: "transparent",
              color: severityFilter !== "all" ? (SEVERITY_COLORS[severityFilter] ?? "#94a3b8") : "#71717a",
              borderColor: severityFilter !== "all" ? (SEVERITY_COLORS[severityFilter] + "50") : "#27272a",
            }}
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Bulk action bar */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div
              className="flex items-center gap-3 px-6 py-3 flex-wrap"
              style={{ background: "#00c8ff08", borderBottom: "1px solid #00c8ff18" }}
            >
              <span className="text-[12px] font-semibold" style={{ color: "#00c8ff" }}>
                {selectedIds.size} selected
              </span>

              <select
                value={bulkCampaignId}
                onChange={(e) => setBulkCampaignId(e.target.value)}
                disabled={bulkAssigning || campaigns.length === 0}
                className="text-[12px] rounded-lg px-2.5 py-1.5 cursor-pointer disabled:opacity-40"
                style={{ background: "#111114", color: "#a1a1aa", border: "1px solid #27272a" }}
              >
                <option value="">
                  {campaigns.length === 0 ? "No campaigns yet" : "Select campaign…"}
                </option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <button
                onClick={handleBulkAssign}
                disabled={!bulkCampaignId || bulkAssigning}
                className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer disabled:opacity-40"
                style={{ background: "#00c8ff", color: "#09090b" }}
              >
                {bulkAssigning
                  ? <><CircleNotch className="w-3.5 h-3.5 animate-spin" /> Assigning…</>
                  : <><ShieldCheckered className="w-3.5 h-3.5" /> Assign to Campaign</>
                }
              </button>

              <button
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
                className="flex items-center gap-1.5 text-[12px] font-medium text-zinc-500 hover:text-red-400 transition-colors cursor-pointer disabled:opacity-40"
              >
                {bulkDeleting
                  ? <CircleNotch className="w-3.5 h-3.5 animate-spin" />
                  : <Trash className="w-3.5 h-3.5" />
                }
                Delete
              </button>

              <button
                onClick={() => setSelectedIds(new Set())}
                className="text-[12px] text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
              >
                Clear
              </button>

              {bulkResult && (
                <div className={`flex items-center gap-1.5 text-[12px] font-medium ml-auto ${bulkResult.ok ? "text-emerald-400" : "text-red-400"}`}>
                  <CheckCircle className="w-3.5 h-3.5" />
                  {bulkResult.text}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-zinc-400 dark:text-zinc-500 text-xs uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-800">
              <th className="px-4 py-3 w-8">
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  checked={allFilterSelected}
                  onChange={toggleSelectAll}
                  className="w-3.5 h-3.5 rounded cursor-pointer accent-[#00c8ff]"
                />
              </th>
              <th className="text-left px-2 py-3 font-medium">Type</th>
              <th className="text-left px-4 py-3 font-medium">Value</th>
              <th className="text-left px-4 py-3 font-medium">Family / Threat</th>
              <th className="text-left px-4 py-3 font-medium">Severity</th>
              <th className="text-left px-4 py-3 font-medium">Conf.</th>
              <th className="text-left px-4 py-3 font-medium">Source</th>
              <th className="text-left px-4 py-3 font-medium">First Seen</th>
              <th className="text-left px-4 py-3 font-medium">Campaign</th>
              <th className="px-4 py-3 font-medium w-8"></th>
            </tr>
          </thead>
          <tbody>
            {slice.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-6 py-14 text-center text-zinc-400 dark:text-zinc-600 text-sm">
                  {iocs.length === 0
                    ? <>No indicators yet. Click the <span className="text-zinc-600 dark:text-zinc-400 font-semibold">Live Feed</span> tab and hit Collect Now.</>
                    : "No indicators match your search"}
                </td>
              </tr>
            ) : (
              slice.map((ioc, i) => (
                <IOCTableRow
                  key={ioc.id}
                  ioc={ioc}
                  index={i}
                  campaigns={campaigns}
                  selected={selectedIds.has(ioc.id)}
                  onToggle={toggleRow}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-200 dark:border-zinc-800">
          <span className="text-zinc-400 dark:text-zinc-500 text-xs">
            Page {page + 1} of {totalPages} &nbsp;·&nbsp;{" "}
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <CaretLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <CaretRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ── IOC Table Row ──────────────────────────────────────────────────────────────

function IOCTableRow({
  ioc, index, campaigns, selected, onToggle,
}: {
  ioc: IOC;
  index: number;
  campaigns: Campaign[];
  selected: boolean;
  onToggle: (id: number) => void;
}) {
  const [assigning, setAssigning] = useState(false);
  const [assigned, setAssigned]   = useState<string | null>(null);

  async function handleAssign(e: React.ChangeEvent<HTMLSelectElement>) {
    const campaignId = Number(e.target.value);
    if (!campaignId) return;
    e.target.value = "";
    const campaign = campaigns.find((c) => c.id === campaignId);
    setAssigning(true);
    try {
      await assignIocToCampaign(campaignId, ioc.id);
      setAssigned(campaign?.name ?? "Campaign");
      setTimeout(() => setAssigned(null), 2500);
    } catch {
      // silent
    } finally {
      setAssigning(false);
    }
  }

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.015 }}
      className={`border-b border-zinc-100 dark:border-zinc-800/60 transition-colors ${
        selected
          ? "bg-[#00c8ff08] dark:bg-[#00c8ff06]"
          : "hover:bg-zinc-50 dark:hover:bg-white/[0.02]"
      }`}
    >
      {/* Checkbox */}
      <td className="px-4 py-3 w-8">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggle(ioc.id)}
          className="w-3.5 h-3.5 rounded cursor-pointer accent-[#00c8ff]"
        />
      </td>

      <td className="px-2 py-3">
        <TypeBadge iocType={ioc.ioc_type} />
      </td>
      <td className="px-4 py-3">
        <span
          className="text-zinc-700 dark:text-zinc-300 font-mono text-xs cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          title={ioc.value}
          onClick={() => navigator.clipboard.writeText(ioc.value)}
        >
          {truncate(ioc.value, 48)}
        </span>
      </td>
      <td className="px-4 py-3">
        {ioc.malware_family ? (
          <span className="text-[#fbbf24] text-xs font-semibold">{ioc.malware_family}</span>
        ) : ioc.threat_type ? (
          <span className="text-[#ff6b35] text-xs">{ioc.threat_type}</span>
        ) : (
          <span className="text-zinc-300 dark:text-zinc-700 text-xs">—</span>
        )}
      </td>
      <td className="px-4 py-3">
        <SeverityBadge severity={ioc.severity ?? "medium"} />
      </td>
      <td className="px-4 py-3">
        <ConfidenceBar value={ioc.confidence ?? 50} />
      </td>
      <td className="px-4 py-3">
        <SourceBadge source={ioc.source ?? "manual"} />
      </td>
      <td className="px-4 py-3 text-zinc-500 text-xs font-mono">
        {ioc.first_seen?.slice(0, 10) ?? ioc.created_at?.slice(0, 10) ?? "—"}
      </td>

      {/* Per-row campaign assign */}
      <td className="px-4 py-3">
        {assigned ? (
          <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium whitespace-nowrap">
            <CheckCircle className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate max-w-[96px]">{assigned}</span>
          </div>
        ) : assigning ? (
          <CircleNotch className="w-3.5 h-3.5 text-zinc-500 animate-spin" />
        ) : (
          <select
            onChange={handleAssign}
            disabled={campaigns.length === 0}
            defaultValue=""
            className="text-[11px] rounded-lg px-2 py-1 cursor-pointer disabled:opacity-30 max-w-[120px]"
            style={{ background: "#111114", color: "#71717a", border: "1px solid #27272a" }}
          >
            <option value="" disabled>
              {campaigns.length === 0 ? "No campaigns" : "Add to…"}
            </option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}
      </td>

      {/* VirusTotal pivot */}
      <td className="px-4 py-3">
        <a
          href={`https://www.virustotal.com/gui/search/${encodeURIComponent(ioc.value)}`}
          target="_blank"
          rel="noopener noreferrer"
          title="Pivot to VirusTotal"
          className="flex items-center justify-center p-1 rounded text-zinc-500 hover:text-[#00c8ff] transition-colors"
        >
          <ArrowSquareOut className="w-3.5 h-3.5" />
        </a>
      </td>
    </motion.tr>
  );
}

// ── Badges ─────────────────────────────────────────────────────────────────────

function TypeBadge({ iocType }: { iocType: string }) {
  const color = IOC_TYPE_COLORS[iocType] ?? "#94a3b8";
  return (
    <span
      className="text-[10px] font-bold px-2 py-0.5 rounded font-mono"
      style={{ color, background: `${color}18`, border: `1px solid ${color}30` }}
    >
      {TYPE_LABELS[iocType] ?? iocType}
    </span>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const color = SEVERITY_COLORS[severity] ?? "#94a3b8";
  return (
    <span
      className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
      style={{ color, background: `${color}18`, border: `1px solid ${color}30` }}
    >
      {severity}
    </span>
  );
}

function ConfidenceBar({ value }: { value: number }) {
  const color =
    value >= 85 ? "#ef4444" :
    value >= 70 ? "#f97316" :
    value >= 55 ? "#fbbf24" :
    "#94a3b8";
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-12 h-1 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden shrink-0">
        <div className="h-full rounded-full" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="text-[11px] font-mono tabular-nums text-zinc-500">{value}</span>
    </div>
  );
}

function SourceBadge({ source }: { source: string }) {
  const colors: Record<string, string> = {
    malwarebazaar: "#00d4ff",
    urlhaus:       "#ff6b35",
    feodotracker:  "#ef4444",
    manual:        "#9f7aea",
  };
  const s = source.split(",")[0].trim();
  const c = colors[s] ?? "#64748b";
  return (
    <span className="text-xs capitalize" style={{ color: c }}>
      {s}
    </span>
  );
}
