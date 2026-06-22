"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  XIcon as X,
  ShieldIcon as Shield,
  HashIcon as Hash,
  StackIcon as Stack,
  ClockIcon as Clock,
  CircleNotchIcon as CircleNotch,
  LinkBreakIcon as LinkBreak,
  MagnifyingGlassIcon as MagnifyingGlass,
  CheckIcon as Check,
  PlusIcon as Plus,
  FloppyDiskIcon as FloppyDisk,
} from "@phosphor-icons/react";
import { Campaign, IOC, TTP, IOC_TYPE_COLORS, BASE } from "@/lib/api";
import { authHeaders } from "@/lib/api/auth";
import {
  fetchCampaignTtps,
  addTtpToCampaign,
  removeTtpFromCampaign,
} from "@/lib/api/campaigns";
import { fetchMitreData, type MitreTechnique } from "@/lib/api/mitre";
import { useConfirm } from "@/hooks/useConfirm";
import { useToast } from "@/hooks/useToast";
import { truncate } from "@/lib/utils";

const MOTIVATION_COLORS: Record<string, string> = {
  espionage:  "#00c8ff",
  financial:  "#fbbf24",
  disruptive: "#ff4444",
  hacktivism: "#9f7aea",
  unknown:    "#71717a",
};

const TYPE_LABELS: Record<string, string> = {
  hash_sha256: "SHA-256",
  hash_md5:    "MD5",
  hash_sha1:   "SHA-1",
  url:         "URL",
  ip:          "IP",
  domain:      "Domain",
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#ef4444",
  high:     "#f97316",
  medium:   "#fbbf24",
  low:      "#94a3b8",
};

const TACTIC_ORDER = [
  "reconnaissance", "resource-development", "initial-access", "execution",
  "persistence", "privilege-escalation", "defense-evasion", "credential-access",
  "discovery", "lateral-movement", "collection", "command-and-control",
  "exfiltration", "impact",
];

const TACTIC_COLORS: Record<string, string> = {
  "reconnaissance":       "#94a3b8",
  "resource-development": "#94a3b8",
  "initial-access":       "#f97316",
  "execution":            "#ef4444",
  "persistence":          "#fbbf24",
  "privilege-escalation": "#fbbf24",
  "defense-evasion":      "#9f7aea",
  "credential-access":    "#ff6b35",
  "discovery":            "#34d399",
  "lateral-movement":     "#60a5fa",
  "collection":           "#00c8ff",
  "command-and-control":  "#f43f5e",
  "exfiltration":         "#fb923c",
  "impact":               "#ef4444",
};

interface Props {
  campaign: Campaign | null;
  onClose: () => void;
  onRefresh: () => void;
}

type ActiveTab = "iocs" | "ttps";

type PendingAdd = { tech: MitreTechnique; tactic: string };

export function CampaignDetailModal({ campaign, onClose, onRefresh }: Props) {
  const [tab, setTab]               = useState<ActiveTab>("iocs");
  const [iocs, setIocs]             = useState<IOC[]>([]);
  const [ttps, setTtps]             = useState<TTP[]>([]);
  const [mitre, setMitre]           = useState<import("@/lib/api/mitre").MitreData | null>(null);
  const [loading, setLoading]       = useState(false);
  const [mitreLoading, setMitreLoading] = useState(false);
  const [pendingAdds, setPendingAdds]       = useState<Map<string, PendingAdd>>(new Map());
  const [pendingRemoves, setPendingRemoves] = useState<Set<string>>(new Set());
  const [saving, setSaving]                 = useState(false);
  const toast   = useToast();
  const confirm = useConfirm();

  const pendingCount = pendingAdds.size + pendingRemoves.size;

  const loadIocs = useCallback(async (id: number) => {
    setLoading(true);
    try {
      const r    = await fetch(`${BASE}/api/campaigns/${id}/iocs`, { headers: authHeaders() });
      const data = await r.json();
      setIocs(Array.isArray(data) ? data : []);
    } catch { setIocs([]); }
    finally { setLoading(false); }
  }, []);

  const loadTtps = useCallback(async (id: number) => {
    setLoading(true);
    setMitreLoading(true);
    try {
      const [savedTtps, mitreData] = await Promise.all([
        fetchCampaignTtps(id),
        fetchMitreData(),
      ]);
      setTtps(savedTtps);
      setMitre(mitreData);
    } catch {
      setTtps([]);
    } finally {
      setLoading(false);
      setMitreLoading(false);
    }
  }, []);

  useEffect(() => {
    setPendingAdds(new Map());
    setPendingRemoves(new Set());
  }, [campaign?.id]);

  useEffect(() => {
    if (!campaign) { setIocs([]); setTtps([]); return; }
    if (tab === "iocs") loadIocs(campaign.id);
    else loadTtps(campaign.id);
  }, [campaign?.id, tab, loadIocs, loadTtps]);

  useEffect(() => {
    if (!campaign) return;
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [campaign, onClose]);

  async function handleRemoveIoc(iocId: number, value: string) {
    const ok = await confirm({
      title: "Remove from campaign?",
      description: `"${truncate(value, 40)}" will be unlinked. The IOC itself won't be deleted.`,
      confirmLabel: "Remove",
      destructive: false,
    });
    if (!ok) return;
    try {
      const r = await fetch(`${BASE}/api/campaigns/${campaign!.id}/iocs/${iocId}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!r.ok) throw new Error();
      toast("IOC removed from campaign");
      setIocs((prev) => prev.filter((i) => i.id !== iocId));
      onRefresh();
    } catch { toast("Failed to remove IOC", "error"); }
  }

  function stageTtpToggle(tech: MitreTechnique, tactic: string) {
    const id          = tech.id;
    const isCommitted = ttps.some((t) => t.technique_id === id);

    if (pendingAdds.has(id)) {
      setPendingAdds((prev) => { const n = new Map(prev); n.delete(id); return n; });
    } else if (pendingRemoves.has(id)) {
      setPendingRemoves((prev) => { const n = new Set(prev); n.delete(id); return n; });
    } else if (isCommitted) {
      setPendingRemoves((prev) => { const n = new Set(prev); n.add(id); return n; });
    } else {
      setPendingAdds((prev) => { const n = new Map(prev); n.set(id, { tech, tactic }); return n; });
    }
  }

  async function handleSaveTtps() {
    if (!campaign || pendingCount === 0) return;
    const addCount = pendingAdds.size;
    const remCount = pendingRemoves.size;
    const parts: string[] = [];
    if (addCount > 0) parts.push(`add ${addCount} technique${addCount !== 1 ? "s" : ""}`);
    if (remCount > 0) parts.push(`remove ${remCount} technique${remCount !== 1 ? "s" : ""}`);

    const ok = await confirm({
      title: `Save ${pendingCount} TTP change${pendingCount !== 1 ? "s" : ""}?`,
      description: `This will ${parts.join(" and ")} for "${campaign.name}".`,
      confirmLabel: "Save",
      destructive: false,
    });
    if (!ok) return;

    setSaving(true);
    try {
      for (const [, { tech, tactic }] of Array.from(pendingAdds)) {
        await addTtpToCampaign(campaign.id, {
          technique_id:   tech.id,
          technique_name: tech.name,
          tactic,
        });
      }
      for (const techId of Array.from(pendingRemoves)) {
        await removeTtpFromCampaign(campaign.id, techId);
      }
      await loadTtps(campaign.id);
      setPendingAdds(new Map());
      setPendingRemoves(new Set());
      onRefresh();
      toast(`${pendingCount} TTP change${pendingCount !== 1 ? "s" : ""} saved`);
    } catch {
      toast("Failed to save TTP changes", "error");
    } finally {
      setSaving(false);
    }
  }

  if (!campaign) return null;
  const motColor = MOTIVATION_COLORS[campaign.motivation] ?? "#71717a";

  return (
    <AnimatePresence>
      {campaign && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[180] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.18 }}
            className="w-full max-w-xl rounded-2xl flex flex-col"
            style={{ background: "#111114", border: "1px solid #27272a", maxHeight: "82vh" }}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 px-6 py-5 shrink-0"
              style={{ borderBottom: "1px solid #27272a" }}>
              <div>
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize"
                    style={{ color: motColor, background: `${motColor}18` }}
                  >
                    {campaign.motivation}
                  </span>
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide"
                    style={{
                      color: campaign.status === "active" ? "#00ff88" : campaign.status === "monitoring" ? "#fbbf24" : "#71717a",
                      background: campaign.status === "active" ? "#00ff8812" : campaign.status === "monitoring" ? "#fbbf2412" : "#71717a12",
                    }}
                  >
                    {campaign.status}
                  </span>
                </div>
                <h2 className="text-zinc-100 font-semibold text-base leading-tight">{campaign.name}</h2>
                {campaign.threat_actor && (
                  <div className="flex items-center gap-1.5 mt-1.5 text-zinc-500 text-xs">
                    <Shield className="w-3 h-3" />
                    <span className="font-mono">{campaign.threat_actor}</span>
                  </div>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 px-6 py-3 shrink-0"
              style={{ borderBottom: "1px solid #27272a" }}>
              <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                <Hash className="w-3 h-3 text-[#00c8ff]" />
                <span className="text-zinc-300 font-semibold">{campaign.ioc_count}</span>
                <span>IOCs</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                <Stack className="w-3 h-3 text-[#9f7aea]" />
                <span className="text-zinc-300 font-semibold">{ttps.length || campaign.ttp_count}</span>
                <span>TTPs</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-zinc-600 ml-auto">
                <Clock className="w-3 h-3" />
                <span className="font-mono">{campaign.updated_at?.slice(0, 10)}</span>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex shrink-0" style={{ borderBottom: "1px solid #27272a" }}>
              {(["iocs", "ttps"] as ActiveTab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                    tab === t ? "text-[#00c8ff]" : "text-zinc-600 hover:text-zinc-400"
                  }`}
                  style={tab === t ? { borderBottom: "2px solid #00c8ff", marginBottom: -1 } : {}}
                >
                  {t === "iocs" ? "Linked IOCs" : "ATT&CK TTPs"}
                </button>
              ))}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {tab === "iocs" ? (
                loading ? (
                  <Spinner label="Loading indicators" />
                ) : iocs.length === 0 ? (
                  <EmptyState
                    Icon={Hash}
                    title="No indicators linked"
                    hint='Select IOCs from the IOCs tab and use "Assign to Campaign" to link them here.'
                  />
                ) : (
                  <div className="divide-y divide-zinc-900">
                    {iocs.map((ioc) => (
                      <IocRow key={ioc.id} ioc={ioc} onRemove={handleRemoveIoc} />
                    ))}
                  </div>
                )
              ) : (
                <TtpPanel
                  ttps={ttps}
                  mitre={mitre}
                  loading={loading || mitreLoading}
                  pendingAdds={pendingAdds}
                  pendingRemoves={pendingRemoves}
                  onToggle={stageTtpToggle}
                  disabled={saving}
                />
              )}
            </div>

            {/* Footer */}
            {tab === "iocs" && iocs.length > 0 && (
              <div className="px-6 py-3 shrink-0 flex items-center justify-between"
                style={{ borderTop: "1px solid #27272a" }}>
                <p className="text-zinc-700 text-xs">
                  {iocs.length} linked indicator{iocs.length !== 1 ? "s" : ""}
                </p>
                <p className="text-zinc-700 text-[11px]">Click value to copy</p>
              </div>
            )}
            {tab === "ttps" && (
              <div className="px-6 py-3 shrink-0 flex items-center justify-between gap-3" style={{ borderTop: "1px solid #27272a" }}>
                <p className="text-zinc-700 text-xs">
                  {ttps.length + pendingAdds.size - pendingRemoves.size} technique{ttps.length + pendingAdds.size - pendingRemoves.size !== 1 ? "s" : ""} mapped.
                  {pendingCount > 0 && (
                    <span className="ml-2" style={{ color: "#fbbf24" }}>
                      {pendingCount} unsaved change{pendingCount !== 1 ? "s" : ""}
                    </span>
                  )}
                </p>
                {pendingCount > 0 && (
                  <button
                    onClick={handleSaveTtps}
                    disabled={saving}
                    className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer disabled:opacity-50 shrink-0"
                    style={{ background: "#00c8ff", color: "#09090b" }}
                  >
                    {saving
                      ? <CircleNotch className="w-3 h-3 animate-spin" />
                      : <FloppyDisk className="w-3 h-3" />
                    }
                    {saving ? "Saving…" : `Save ${pendingCount} Change${pendingCount !== 1 ? "s" : ""}`}
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Spinner({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-14 text-zinc-600 text-sm">
      <CircleNotch className="w-4 h-4 animate-spin" />
      {label}
    </div>
  );
}

function EmptyState({ Icon, title, hint }: { Icon: React.ComponentType<{ className?: string; weight?: "thin" | "light" | "regular" | "bold" | "fill" | "duotone" }>; title: string; hint: string }) {
  return (
    <div className="flex flex-col items-center py-14 gap-2 text-center px-6">
      <Icon className="w-8 h-8 text-zinc-800" />
      <p className="text-zinc-500 text-sm font-medium">{title}</p>
      <p className="text-zinc-700 text-xs leading-relaxed">
        {hint.split(/"([^"]+)"/).map((part, i) =>
          i % 2 === 1
            ? <span key={i} className="text-zinc-500">{part}</span>
            : part
        )}
      </p>
    </div>
  );
}

function IocRow({ ioc, onRemove }: { ioc: IOC; onRemove: (id: number, value: string) => void }) {
  const [removing, setRemoving] = useState(false);
  const color    = IOC_TYPE_COLORS[ioc.ioc_type] ?? "#94a3b8";
  const sevColor = SEVERITY_COLORS[ioc.severity] ?? "#94a3b8";

  async function handleRemove() {
    setRemoving(true);
    try { await onRemove(ioc.id, ioc.value); }
    finally { setRemoving(false); }
  }

  return (
    <div className="flex items-center gap-3 px-6 py-3 hover:bg-white/[0.015] transition-colors group">
      <span
        className="text-[10px] font-bold px-1.5 py-0.5 rounded font-mono shrink-0"
        style={{ color, background: `${color}15`, border: `1px solid ${color}25` }}
      >
        {TYPE_LABELS[ioc.ioc_type] ?? ioc.ioc_type}
      </span>
      <span
        className="flex-1 font-mono text-[12px] text-zinc-400 truncate cursor-pointer hover:text-zinc-200 transition-colors"
        title={ioc.value}
        onClick={() => navigator.clipboard.writeText(ioc.value)}
      >
        {truncate(ioc.value, 52)}
      </span>
      <div className="flex items-center gap-2 shrink-0">
        {ioc.malware_family && (
          <span className="text-[11px] text-[#fbbf24] hidden sm:block">{ioc.malware_family}</span>
        )}
        <span
          className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded hidden sm:block"
          style={{ color: sevColor, background: `${sevColor}15` }}
        >
          {ioc.severity}
        </span>
        <button
          onClick={handleRemove}
          disabled={removing}
          className="p-1 rounded text-zinc-700 hover:text-red-400 transition-colors cursor-pointer disabled:opacity-40 opacity-0 group-hover:opacity-100"
          title="Remove from campaign"
        >
          {removing
            ? <CircleNotch className="w-3.5 h-3.5 animate-spin" />
            : <LinkBreak className="w-3.5 h-3.5" />
          }
        </button>
      </div>
    </div>
  );
}

function TtpPanel({
  ttps,
  mitre,
  loading,
  pendingAdds,
  pendingRemoves,
  onToggle,
  disabled,
}: {
  ttps: TTP[];
  mitre: import("@/lib/api/mitre").MitreData | null;
  loading: boolean;
  pendingAdds: Map<string, PendingAdd>;
  pendingRemoves: Set<string>;
  onToggle: (tech: MitreTechnique, tactic: string) => void;
  disabled?: boolean;
}) {
  const [q, setQ] = useState("");

  if (loading) return <Spinner label="Loading techniques…" />;
  if (!mitre)  return <Spinner label="Loading ATT&CK data…" />;

  const committedIds = new Set(ttps.map((t) => t.technique_id));
  const lower        = q.toLowerCase();

  const techniquesByTactic: Record<string, MitreTechnique[]> = {};
  for (const tech of mitre.techniques) {
    for (const tactic of tech.tactics) {
      if (!techniquesByTactic[tactic]) techniquesByTactic[tactic] = [];
      techniquesByTactic[tactic].push(tech);
    }
  }

  const groups: { shortname: string; label: string; color: string; techs: MitreTechnique[] }[] = [];
  for (const shortname of TACTIC_ORDER) {
    const tactic = mitre.tactics[shortname];
    if (!tactic) continue;
    let techs = techniquesByTactic[shortname] ?? [];
    if (q) {
      techs = techs.filter(
        (t) => t.id.toLowerCase().includes(lower) || t.name.toLowerCase().includes(lower) || tactic.label.toLowerCase().includes(lower)
      );
    }
    if (!techs.length) continue;
    groups.push({ shortname, label: tactic.label, color: TACTIC_COLORS[shortname] ?? "#94a3b8", techs });
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="px-4 py-3 shrink-0" style={{ borderBottom: "1px solid #1e1e24" }}>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "#0c0c0f", border: "1px solid #27272a" }}>
          <MagnifyingGlass className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by ID, name, or tactic…"
            className="flex-1 bg-transparent text-[12px] text-zinc-300 placeholder-zinc-600 focus:outline-none"
          />
        </div>
      </div>

      {/* Technique grid */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {groups.map(({ shortname, label, color, techs }) => (
          <div key={shortname}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600 mb-2">
              {label}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {techs.map((tech) => {
                const isPendingAdd    = pendingAdds.has(tech.id);
                const isPendingRemove = pendingRemoves.has(tech.id);
                const effective       = (committedIds.has(tech.id) && !isPendingRemove) || isPendingAdd;
                return (
                  <button
                    key={`${shortname}-${tech.id}`}
                    onClick={() => onToggle(tech, shortname)}
                    disabled={!!disabled}
                    title={`${tech.id}: ${tech.name}`}
                    className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded transition-all cursor-pointer disabled:opacity-50"
                    style={effective
                      ? { color, background: `${color}20`, border: `1px solid ${color}45`, opacity: isPendingRemove ? 0.45 : 1 }
                      : { color: "#52525b", background: "#18181b", border: "1px solid #27272a" }
                    }
                  >
                    {isPendingAdd
                      ? <Plus className="w-2.5 h-2.5" weight="bold" />
                      : effective
                      ? <Check className="w-2.5 h-2.5" weight="bold" />
                      : null
                    }
                    {tech.id}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        {groups.length === 0 && (
          <p className="text-zinc-700 text-xs text-center py-6">No techniques match your search.</p>
        )}
      </div>
    </div>
  );
}
