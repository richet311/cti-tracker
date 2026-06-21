"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CircleNotchIcon as CircleNotch, WarningIcon as Warning } from "@phosphor-icons/react";
import { HelpTip } from "@/components/shared/HelpTip";
import { BASE } from "@/lib/api";
import { authHeaders } from "@/lib/api/auth";
import { fetchMitreData, type MitreData, type MitreTechnique } from "@/lib/api/mitre";
import type { TTP } from "@/lib/api";

const TACTIC_ORDER = [
  "reconnaissance",
  "resource-development",
  "initial-access",
  "execution",
  "persistence",
  "privilege-escalation",
  "defense-evasion",
  "credential-access",
  "discovery",
  "lateral-movement",
  "collection",
  "command-and-control",
  "exfiltration",
  "impact",
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

export function MitreMatrix() {
  const [ttps, setTtps]           = useState<TTP[]>([]);
  const [mitre, setMitre]         = useState<MitreData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`${BASE}/api/ttps`, { headers: authHeaders() })
        .then((r) => r.json())
        .then((d) => (Array.isArray(d) ? d : [])),
      fetchMitreData(),
    ])
      .then(([savedTtps, mitreData]) => {
        setTtps(savedTtps);
        setMitre(mitreData);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-zinc-600 text-sm">
        <CircleNotch className="w-4 h-4 animate-spin" />
        Loading ATT&amp;CK data&hellip;
      </div>
    );
  }

  if (error || !mitre) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <Warning className="w-8 h-8 text-zinc-700" />
        <p className="text-zinc-500 text-sm">Could not load ATT&amp;CK framework</p>
        <p className="text-zinc-700 text-xs max-w-xs">{error ?? "Unknown error"}</p>
      </div>
    );
  }

  const covered = new Set(ttps.map((t) => t.technique_id.split(".")[0]));

  // Group techniques by tactic in canonical order
  const tacticGroups: { shortname: string; tactic: MitreData["tactics"][string]; techniques: MitreTechnique[] }[] = [];
  const techniquesByTactic: Record<string, MitreTechnique[]> = {};
  for (const tech of mitre.techniques) {
    for (const tactic of tech.tactics) {
      if (!techniquesByTactic[tactic]) techniquesByTactic[tactic] = [];
      techniquesByTactic[tactic].push(tech);
    }
  }
  for (const shortname of TACTIC_ORDER) {
    const tactic = mitre.tactics[shortname];
    if (!tactic) continue;
    const techniques = techniquesByTactic[shortname] ?? [];
    if (!techniques.length) continue;
    tacticGroups.push({ shortname, tactic, techniques });
  }

  const totalTechniques = new Set(mitre.techniques.map((t) => t.id)).size;
  const coveredCount    = mitre.techniques.filter((t) => covered.has(t.id)).length;
  const coveragePct     = totalTechniques > 0 ? Math.round((coveredCount / totalTechniques) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Page header */}
      <div className="flex items-start justify-between mb-5 gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-zinc-600 dark:text-zinc-400 text-sm font-semibold uppercase tracking-widest">
              MITRE ATT&amp;CK Coverage
            </h2>
            <HelpTip
              title="ATT&CK Matrix"
              steps={[
                'Open a Campaign card and click "View IOCs", then switch to the "ATT&CK TTPs" tab.',
                "Search for a technique by ID (e.g. T1566) or name and click it to add.",
                "Added techniques appear highlighted here under their tactic column.",
                "The coverage bar shows how many of the tracked techniques have been observed.",
                "Hover any chip to see the full technique name and ID.",
              ]}
            />
          </div>
          <p className="text-zinc-600 text-xs">
            {coveredCount} of {totalTechniques} techniques observed across campaigns
          </p>
        </div>
        <div className="flex items-center gap-5 text-xs shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm" style={{ background: "#00c8ff25", border: "1px solid #00c8ff55" }} />
            <span className="text-zinc-500">Observed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm" style={{ background: "#18181b", border: "1px solid #27272a" }} />
            <span className="text-zinc-500">Not observed</span>
          </div>
        </div>
      </div>

      {/* Coverage bar */}
      <div className="card p-4 mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-zinc-500 text-xs">Overall technique coverage</span>
          <span className="font-mono font-semibold text-sm" style={{ color: "#00c8ff" }}>
            {coveragePct}%
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${coveragePct}%` }}
            transition={{ duration: 0.9, ease: "easeOut", delay: 0.1 }}
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg, #00c8ff, #9f7aea)" }}
          />
        </div>
        {ttps.length === 0 && (
          <p className="text-zinc-700 text-[11px] mt-2">
            No TTPs recorded yet. Open a campaign, go to the ATT&amp;CK TTPs tab, and click techniques to map them.
          </p>
        )}
      </div>

      {/* Tactic cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {tacticGroups.map(({ shortname, tactic, techniques }, ti) => {
          const color       = TACTIC_COLORS[shortname] ?? "#94a3b8";
          const coveredHere = techniques.filter((t) => covered.has(t.id));
          const hasAny      = coveredHere.length > 0;

          return (
            <motion.div
              key={shortname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: ti * 0.025, duration: 0.3 }}
              className="rounded-xl overflow-hidden"
              style={{
                background: "#0c0c0f",
                border: hasAny ? `1px solid ${color}28` : "1px solid #1e1e24",
              }}
            >
              {/* Tactic header */}
              <div
                className="px-4 py-2.5 flex items-center justify-between"
                style={{
                  background:   hasAny ? `${color}0a` : "#111114",
                  borderBottom: "1px solid #1e1e24",
                }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded shrink-0"
                    style={hasAny
                      ? { color, background: `${color}18`, border: `1px solid ${color}30` }
                      : { color: "#3f3f46", background: "#18181b", border: "1px solid #27272a" }
                    }
                  >
                    {tactic.id}
                  </span>
                  <span
                    className="text-[12px] font-semibold truncate"
                    style={{ color: hasAny ? color : "#52525b" }}
                  >
                    {tactic.label}
                  </span>
                </div>
                <span
                  className="text-[10px] font-mono font-semibold shrink-0 ml-2"
                  style={{ color: hasAny ? color : "#3f3f46" }}
                >
                  {coveredHere.length}/{techniques.length}
                </span>
              </div>

              {/* Technique chips */}
              <div className="p-3 flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                {techniques.map((tech) => {
                  const isCovered = covered.has(tech.id);
                  return (
                    <span
                      key={`${shortname}-${tech.id}`}
                      title={`${tech.id}: ${tech.name}`}
                      className="text-[10px] font-mono px-2 py-0.5 rounded cursor-default"
                      style={isCovered
                        ? { color, background: `${color}18`, border: `1px solid ${color}38` }
                        : { color: "#3f3f46", background: "#18181b", border: "1px solid #27272a" }
                      }
                    >
                      {tech.id}
                    </span>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
