"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldIcon as Shield,
  HashIcon as Hash,
  StackIcon as Stack,
  ClockIcon as Clock,
  PlusIcon as Plus,
  XIcon as X,
  FileTextIcon as FileText,
  CircleNotchIcon as CircleNotch,
  CheckCircleIcon as CheckCircle,
  WarningCircleIcon as WarningCircle,
  TrashIcon as Trash,
} from "@phosphor-icons/react";
import { Campaign, Report, createCampaign, generateCampaignReport, deleteCampaign } from "@/lib/api";
import { useConfirm } from "@/hooks/useConfirm";
import { useToast } from "@/hooks/useToast";
import { CampaignDetailModal } from "@/components/CampaignDetailModal";
import { HelpTip } from "@/components/shared/HelpTip";

interface Props {
  campaigns: Campaign[];
  reports: Report[];
  onRefresh: () => void;
}

const MOTIVATION_COLORS: Record<string, { text: string; bg: string }> = {
  espionage:  { text: "#00c8ff", bg: "#00c8ff18" },
  financial:  { text: "#fbbf24", bg: "#fbbf2418" },
  disruptive: { text: "#ff4444", bg: "#ff444418" },
  hacktivism: { text: "#9f7aea", bg: "#9f7aea18" },
  unknown:    { text: "#71717a", bg: "#71717a18" },
};

const STATUS_STYLES: Record<string, string> = {
  active:     "text-[#00ff88] bg-[#00ff8812] border-[#00ff8830]",
  closed:     "text-zinc-400 bg-zinc-800 border-zinc-700",
  monitoring: "text-[#fbbf24] bg-[#fbbf2412] border-[#fbbf2430]",
};

const DEFAULT_FORM = { name: "", threat_actor: "", motivation: "unknown", status: "active", description: "" };

const INPUT_CLASS =
  "w-full rounded-lg px-3 py-2 text-[13px] text-zinc-200 placeholder-zinc-600 focus:outline-none transition-colors"
  + " bg-zinc-900 border border-zinc-700 focus:border-zinc-500";

// Small hover tooltip component
function Tip({ label, children }: { label: string; children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  return (
    <div
      className="relative"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
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

export default function CampaignCards({ campaigns, reports, onRefresh }: Props) {
  const [showModal, setShowModal]       = useState(false);
  const [creating, setCreating]         = useState(false);
  const [formError, setFormError]       = useState<string | null>(null);
  const [form, setForm]                 = useState({ ...DEFAULT_FORM });
  const [detailCampaign, setDetailCampaign] = useState<Campaign | null>(null);

  function openModal() {
    setFormError(null);
    setForm({ ...DEFAULT_FORM });
    setShowModal(true);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setFormError("Campaign name is required"); return; }
    setCreating(true);
    setFormError(null);
    try {
      await createCampaign({
        name:         form.name.trim(),
        threat_actor: form.threat_actor.trim() || undefined,
        motivation:   form.motivation,
        status:       form.status,
        description:  form.description.trim() || undefined,
      });
      setShowModal(false);
      onRefresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create campaign");
    } finally {
      setCreating(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.4 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-zinc-600 dark:text-zinc-400 text-sm font-semibold uppercase tracking-widest">
            Tracked Campaigns
          </h2>
          <HelpTip
            title="Campaigns"
            steps={[
              'Click "New Campaign" to create a threat actor tracking group.',
              'Assign IOCs from the IOCs tab using the "Assign to Campaign" action.',
              'Click "View IOCs" on a card to manage linked indicators.',
              'Open the TTPs tab in the detail modal to map MITRE ATT&CK techniques.',
              'Click "Generate Report" to produce a TLP-classified intelligence report.',
            ]}
          />
        </div>
        <button
          onClick={openModal}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer"
          style={{ background: "#00c8ff14", color: "#00c8ff", border: "1px solid #00c8ff28" }}
        >
          <Plus className="w-3.5 h-3.5" weight="bold" />
          New Campaign
        </button>
      </div>

      {campaigns.length === 0 ? (
        <div className="card p-12 flex flex-col items-center gap-3 text-center">
          <Shield className="w-9 h-9 text-zinc-700" />
          <p className="text-zinc-400 text-sm font-medium">No campaigns tracked yet</p>
          <p className="text-zinc-600 text-xs max-w-xs leading-relaxed">
            Create a campaign to group collected IOCs into adversary threat actor profiles.
          </p>
          <button
            onClick={openModal}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg mt-1 transition-all cursor-pointer"
            style={{ background: "#00c8ff14", color: "#00c8ff", border: "1px solid #00c8ff28" }}
          >
            <Plus className="w-3.5 h-3.5" weight="bold" />
            New Campaign
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {campaigns.map((c, i) => (
            <CampaignItem
              key={c.id}
              campaign={c}
              index={i}
              existingReportCount={reports.filter((r) => r.campaign_id === c.id).length}
              onRefresh={onRefresh}
              onViewDetail={setDetailCampaign}
            />
          ))}
        </div>
      )}

      <CampaignDetailModal
        campaign={detailCampaign}
        onClose={() => setDetailCampaign(null)}
        onRefresh={onRefresh}
      />

      {/* New Campaign Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.18 }}
              className="w-full max-w-md rounded-xl p-6"
              style={{ background: "#111114", border: "1px solid #27272a" }}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-zinc-200 font-semibold text-sm">New Campaign</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="flex flex-col gap-4">
                <ModalField label="Campaign Name" required>
                  <input
                    type="text"
                    placeholder="e.g. Operation SilverFox"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className={INPUT_CLASS}
                    autoFocus
                  />
                </ModalField>

                <ModalField label="Threat Actor">
                  <input
                    type="text"
                    placeholder="e.g. APT29, Lazarus Group"
                    value={form.threat_actor}
                    onChange={(e) => setForm((f) => ({ ...f, threat_actor: e.target.value }))}
                    className={INPUT_CLASS}
                  />
                </ModalField>

                <div className="grid grid-cols-2 gap-3">
                  <ModalField label="Motivation">
                    <select
                      value={form.motivation}
                      onChange={(e) => setForm((f) => ({ ...f, motivation: e.target.value }))}
                      className={INPUT_CLASS}
                    >
                      <option value="unknown">Unknown</option>
                      <option value="espionage">Espionage</option>
                      <option value="financial">Financial</option>
                      <option value="disruptive">Disruptive</option>
                      <option value="hacktivism">Hacktivism</option>
                    </select>
                  </ModalField>

                  <ModalField label="Status">
                    <select
                      value={form.status}
                      onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                      className={INPUT_CLASS}
                    >
                      <option value="active">Active</option>
                      <option value="monitoring">Monitoring</option>
                      <option value="closed">Closed</option>
                    </select>
                  </ModalField>
                </div>

                <ModalField label="Description">
                  <textarea
                    placeholder="Briefly describe this campaign..."
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    className={`${INPUT_CLASS} resize-none`}
                    rows={2}
                  />
                </ModalField>

                {formError && (
                  <div className="flex items-center gap-2 text-[12px] text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">
                    <WarningCircle className="w-3.5 h-3.5 shrink-0" />
                    {formError}
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 rounded-lg text-xs font-semibold text-zinc-400 border border-zinc-700 hover:border-zinc-500 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                    style={{ background: "#00c8ff", color: "#09090b" }}
                  >
                    {creating ? "Creating..." : "Create Campaign"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ModalField({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function CampaignItem({
  campaign: c,
  index,
  existingReportCount,
  onRefresh,
  onViewDetail,
}: {
  campaign: Campaign;
  index: number;
  existingReportCount: number;
  onRefresh: () => void;
  onViewDetail: (c: Campaign) => void;
}) {
  const mot         = MOTIVATION_COLORS[c.motivation] ?? MOTIVATION_COLORS.unknown;
  const statusClass = STATUS_STYLES[c.status] ?? STATUS_STYLES.active;
  const confirm     = useConfirm();
  const toast       = useToast();
  const [reporting, setReporting] = useState(false);
  const [reportMsg, setReportMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [deleting, setDeleting]   = useState(false);

  async function handleDelete() {
    const ok = await confirm({
      title: `Delete "${c.name}"?`,
      description: "This will permanently remove the campaign and all its linked data.",
    });
    if (!ok) return;
    setDeleting(true);
    try {
      await deleteCampaign(c.id);
      toast(`Campaign "${c.name}" deleted`);
      onRefresh();
    } catch {
      toast("Failed to delete campaign", "error");
      setDeleting(false);
    }
  }

  async function handleGenReport() {
    if (existingReportCount > 0) {
      const ok = await confirm({
        title: "Generate another report?",
        description: `This campaign already has ${existingReportCount} report${existingReportCount !== 1 ? "s" : ""}. A new snapshot will be created with the current data.`,
        confirmLabel: "Generate",
        destructive: false,
      });
      if (!ok) return;
    }

    setReporting(true);
    setReportMsg(null);
    try {
      await generateCampaignReport(c.id);
      setReportMsg({ text: "Report saved", ok: true });
      toast("Report generated successfully");
      onRefresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed";
      setReportMsg({ text: msg, ok: false });
      toast(msg, "error");
    } finally {
      setReporting(false);
      setTimeout(() => setReportMsg(null), 3500);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.06 }}
      className="card p-5 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all hover:-translate-y-0.5 flex flex-col"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-zinc-800 dark:text-zinc-200 font-semibold text-sm leading-tight flex-1 pr-2">
          {c.name}
        </h3>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusClass}`}>
            {c.status.toUpperCase()}
          </span>
          <Tip label="Delete campaign">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="p-1 rounded text-zinc-600 hover:text-red-400 hover:bg-red-400/10 transition-colors cursor-pointer disabled:opacity-40"
            >
              {deleting
                ? <CircleNotch className="w-3.5 h-3.5 animate-spin" />
                : <Trash className="w-3.5 h-3.5" />
              }
            </button>
          </Tip>
        </div>
      </div>

      {c.threat_actor && (
        <div className="flex items-center gap-1.5 mb-3 text-zinc-500 text-xs">
          <Shield className="w-3 h-3" />
          <span className="font-mono">{c.threat_actor}</span>
        </div>
      )}

      <span
        className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mb-4 capitalize w-fit"
        style={{ color: mot.text, background: mot.bg }}
      >
        {c.motivation}
      </span>

      <div className="flex items-center gap-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-1.5 text-zinc-500 text-xs">
          <Hash className="w-3 h-3 text-[#00c8ff]" />
          <span className="text-zinc-700 dark:text-zinc-300 font-semibold">{c.ioc_count}</span>
          <span>IOCs</span>
        </div>
        <div className="flex items-center gap-1.5 text-zinc-500 text-xs">
          <Stack className="w-3 h-3 text-[#9f7aea]" />
          <span className="text-zinc-700 dark:text-zinc-300 font-semibold">{c.ttp_count}</span>
          <span>TTPs</span>
        </div>
        <div className="flex items-center gap-1.5 text-zinc-400 dark:text-zinc-500 text-xs ml-auto">
          <Clock className="w-3 h-3" />
          <span>{c.updated_at?.slice(0, 10) ?? "—"}</span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2">
        {reportMsg ? (
          <div className={`flex items-center gap-1.5 text-[11px] font-medium ${reportMsg.ok ? "text-emerald-400" : "text-red-400"}`}>
            {reportMsg.ok ? <CheckCircle className="w-3.5 h-3.5" /> : <WarningCircle className="w-3.5 h-3.5" />}
            {reportMsg.text}
          </div>
        ) : (
          <button
            onClick={handleGenReport}
            disabled={reporting}
            className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] px-2 py-1 rounded-md -ml-2 transition-all cursor-pointer disabled:opacity-40"
          >
            {reporting
              ? <CircleNotch className="w-3.5 h-3.5 animate-spin" />
              : <FileText className="w-3.5 h-3.5" />
            }
            {reporting ? "Generating..." : "Generate Report"}
            {existingReportCount > 0 && !reporting && (
              <span className="text-[9px] font-mono px-1 rounded" style={{ color: "#52525b", background: "#27272a" }}>
                {existingReportCount}
              </span>
            )}
          </button>
        )}
        <button
          onClick={() => onViewDetail(c)}
          className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-600 hover:text-[#00c8ff] hover:bg-[#00c8ff08] px-2 py-1 rounded-md -mr-2 transition-all cursor-pointer"
        >
          <Hash className="w-3.5 h-3.5" />
          View IOCs
        </button>
      </div>
    </motion.div>
  );
}
