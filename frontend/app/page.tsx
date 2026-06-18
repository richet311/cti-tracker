"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ShieldIcon as Shield,
  ArrowRightIcon as ArrowRight,
  SunIcon as Sun,
  MoonIcon as Moon,
  DatabaseIcon as Database,
  BroadcastIcon as Broadcast,
  TargetIcon as Target,
  FolderIcon as Folder,
  FileTextIcon as FileText,
  MagnifyingGlassIcon as MagnifyingGlass,
  ChartBarIcon as ChartBar,
  CaretRightIcon as CaretRight,
} from "@phosphor-icons/react";

// ── Types ─────────────────────────────────────────────────────────────────────

type FeatureIcon = typeof Shield;

interface Feature {
  title: string;
  desc: string;
  Icon: FeatureIcon;
  tags?: string[];
  wide?: boolean;
}

interface Step {
  num: string;
  title: string;
  Icon: FeatureIcon;
  desc: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const ACCENT = "#00c8ff";

const FEED_LINES = [
  { type: "SHA256", value: "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2", src: "MB" },
  { type: "URL",    value: "http://malicious-c2.ru/payload/stage2.exe",               src: "UH" },
  { type: "MD5",    value: "5f4dcc3b5aa765d61d8327deb882cf99",                        src: "MB" },
  { type: "IP",     value: "185.220.101.47",                                           src: "UH" },
  { type: "SHA256", value: "e3b0c44298fc1c149afbf4c8996fb924...",                      src: "MB" },
  { type: "Domain", value: "cdn-update-service.xyz",                                   src: "UH" },
];

const FEATURES: Feature[] = [
  {
    title: "Live IOC Collection",
    desc: "WebSocket-powered streaming from MalwareBazaar and URLhaus. Watch indicators appear in real time as they're pulled from active threat feeds.",
    Icon: Broadcast,
    tags: ["MalwareBazaar", "URLhaus", "WebSocket"],
    wide: true,
  },
  {
    title: "MITRE ATT&CK Mapping",
    desc: "Map adversary techniques to the MITRE ATT&CK framework. Search TTPs by ID or keyword and attach them directly to campaigns.",
    Icon: Target,
  },
  {
    title: "Campaign Tracking",
    desc: "Group IOCs into adversary campaigns. Track threat actors, motivations, and link associated TTPs.",
    Icon: Folder,
  },
  {
    title: "Intelligence Reports",
    desc: "TLP-classified tactical and flash reports with executive summaries, IOC blocklists, and defensive recommendations.",
    Icon: FileText,
  },
  {
    title: "IOC Analysis",
    desc: "Auto-detect SHA256, MD5, SHA1, IPs, URLs, and domains. Enrich with malware family and threat classification.",
    Icon: MagnifyingGlass,
  },
];

const STEPS: Step[] = [
  {
    num: "01",
    title: "Collect",
    Icon: Database,
    desc: "Pull IOCs from live threat feeds via WebSocket. MalwareBazaar samples and URLhaus URLs stream directly into your local database in real time.",
  },
  {
    num: "02",
    title: "Analyze",
    Icon: ChartBar,
    desc: "Auto-classify indicators, suggest campaign groupings based on shared malware families, and map techniques to MITRE ATT&CK.",
  },
  {
    num: "03",
    title: "Report",
    Icon: FileText,
    desc: "Generate TLP-classified intelligence: tactical reports with executive summaries, blocklists, and defensive recommendations.",
  },
];

// ── Animation helper ───────────────────────────────────────────────────────────

function fadeIn(delay = 0) {
  return {
    initial: { opacity: 0, y: 14 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-40px" },
    transition: { duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] },
  };
}

// ── Decorative components ──────────────────────────────────────────────────────

function SectionDivider() {
  return (
    <div className="w-full h-px bg-gradient-to-r from-transparent via-[#00c8ff]/25 to-transparent" />
  );
}

function IocStreamPreview({ dark }: { dark: boolean }) {
  const rows = [
    { type: "SHA256", value: "a1b2c3d4e5f6a1b2...", src: "MB" },
    { type: "URL",    value: "http://malicious-c2.ru/payload...", src: "UH" },
    { type: "IP",     value: "185.220.101.47", src: "UH" },
    { type: "MD5",    value: "5f4dcc3b5aa765d6...", src: "MB" },
  ];
  return (
    <div
      className="rounded-lg overflow-hidden text-[10px] font-mono w-full"
      style={{ border: `1px solid ${dark ? "#3f3f46" : "#e4e4e7"}` }}
    >
      <div
        className="flex items-center justify-between px-3 py-2 border-b"
        style={{
          background: dark ? "#18181b" : "#f4f4f5",
          borderColor: dark ? "#3f3f46" : "#e4e4e7",
        }}
      >
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: ACCENT }} />
          <span style={{ color: dark ? "#a1a1aa" : "#71717a" }} className="tracking-wide">ioc_stream</span>
        </div>
        <span style={{ color: ACCENT }} className="opacity-70">4 new</span>
      </div>
      {rows.map((row, i) => (
        <div
          key={i}
          className="flex items-center gap-2 px-3 py-1.5 border-b last:border-0"
          style={{
            background: dark ? "#111114" : "#ffffff",
            borderColor: dark ? "#27272a" : "#f0f0f0",
          }}
        >
          <span
            className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold"
            style={{ color: ACCENT, background: `${ACCENT}14`, border: `1px solid ${ACCENT}26` }}
          >
            {row.type}
          </span>
          <span style={{ color: dark ? "#a1a1aa" : "#52525b" }} className="truncate flex-1">{row.value}</span>
          <span style={{ color: dark ? "#52525b" : "#a1a1aa" }} className="shrink-0">{row.src}</span>
        </div>
      ))}
    </div>
  );
}

function CtaRings() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
      {[180, 300, 440, 600, 760].map((d, i) => (
        <div
          key={d}
          className="absolute rounded-full border border-[#00c8ff]"
          style={{ width: d, height: d, opacity: 0.05 - i * 0.006 }}
        />
      ))}
    </div>
  );
}

function PipelineSvg({ dark }: { dark: boolean }) {
  const nodeFill = dark ? "#1a1a1f" : "#f0f0f2";
  return (
    <svg
      viewBox="0 0 320 64"
      fill="none"
      className="w-full max-w-xs h-auto opacity-60"
      aria-hidden="true"
    >
      <rect x="2" y="20" width="60" height="24" rx="6" fill={nodeFill} stroke={ACCENT} strokeWidth="1" strokeOpacity="0.8" />
      <text x="32" y="36" textAnchor="middle" fontSize="9" fill={ACCENT} fontFamily="monospace" opacity="0.9">COLLECT</text>
      <line x1="62" y1="32" x2="108" y2="32" stroke={ACCENT} strokeWidth="1" strokeOpacity="0.4" strokeDasharray="3 2" />
      <polygon points="108,28 116,32 108,36" fill={ACCENT} opacity="0.4" />
      <rect x="118" y="20" width="60" height="24" rx="6" fill={nodeFill} stroke={ACCENT} strokeWidth="1" strokeOpacity="0.55" />
      <text x="148" y="36" textAnchor="middle" fontSize="9" fill={ACCENT} fontFamily="monospace" opacity="0.6">ANALYZE</text>
      <line x1="178" y1="32" x2="224" y2="32" stroke={ACCENT} strokeWidth="1" strokeOpacity="0.3" strokeDasharray="3 2" />
      <polygon points="224,28 232,32 224,36" fill={ACCENT} opacity="0.3" />
      <rect x="234" y="20" width="60" height="24" rx="6" fill={nodeFill} stroke={ACCENT} strokeWidth="1" strokeOpacity="0.35" />
      <text x="264" y="36" textAnchor="middle" fontSize="9" fill={ACCENT} fontFamily="monospace" opacity="0.4">REPORT</text>
      <circle cx="14" cy="32" r="2.5" fill={ACCENT} opacity="0.7" />
      <circle cx="130" cy="32" r="2.5" fill={ACCENT} opacity="0.45" />
      <circle cx="246" cy="32" r="2.5" fill={ACCENT} opacity="0.3" />
    </svg>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Landing() {
  const [dark, setDark] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(0);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("cti-theme");
    const isDark = saved !== "light";
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setVisible((v) => {
        if (v >= FEED_LINES.length) { clearInterval(t); return v; }
        return v + 1;
      });
    }, 720);
    return () => clearInterval(t);
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("cti-theme", next ? "dark" : "light");
  }

  return (
    <div className="min-h-screen bg-[#f3f3f5] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 transition-colors duration-200">

      {/* ── Navbar ─────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 h-14 flex items-center justify-between px-6 sm:px-10 border-b border-zinc-200/80 dark:border-zinc-900 bg-[#f3f3f5]/90 dark:bg-[#09090b]/90 backdrop-blur-xl">
        <div className="flex items-center gap-2.5">
          <Shield className="w-5 h-5" weight="fill" style={{ color: ACCENT }} />
          <span className="font-bold tracking-tight text-sm">CTI Tracker</span>
        </div>

        <div className="hidden sm:flex items-center gap-7 text-sm text-zinc-500 dark:text-zinc-400">
          <a href="#features" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">How it works</a>
        </div>

        <div className="flex items-center gap-2">
          {mounted && (
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
              aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          )}
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ background: ACCENT, color: "#09090b" }}
          >
            Dashboard <ArrowRight className="w-3.5 h-3.5" weight="bold" />
          </Link>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-14 px-6 text-center">
        <div className="max-w-4xl mx-auto">

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-8"
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: ACCENT }} />
            Threat Intelligence Platform
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="text-5xl sm:text-7xl font-black tracking-tighter mb-5 leading-[1.05]"
          >
            <span className="text-zinc-900 dark:text-white">Track. Analyze.</span>
            <br />
            <span style={{ color: ACCENT }}>Neutralize.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.18 }}
            className="text-zinc-500 dark:text-zinc-400 text-lg max-w-xl mx-auto mb-10 leading-relaxed"
          >
            A full-stack CTI platform for analysts: real-time IOC collection,
            MITRE ATT&amp;CK mapping, and finished intelligence reports.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.26 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12"
          >
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-sm transition-opacity hover:opacity-90"
              style={{ background: ACCENT, color: "#09090b" }}
            >
              Open Dashboard <ArrowRight className="w-4 h-4" weight="bold" />
            </Link>
            <a
              href="#features"
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 text-sm font-medium hover:border-zinc-400 dark:hover:border-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              See features <CaretRight className="w-4 h-4" />
            </a>
          </motion.div>

          {/* Feed card */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.38 }}
            className="max-w-lg mx-auto rounded-xl overflow-hidden text-left"
            style={{
              background: dark ? "#111116" : "#ffffff",
              boxShadow: dark
                ? "0 24px 64px rgba(0,0,0,0.45)"
                : "0 8px 40px rgba(0,0,0,0.08)",
              border: `1px solid ${dark ? "#27272a" : "#e4e4e7"}`,
              borderTop: `2px solid ${ACCENT}`,
            }}
          >
            <div
              className="flex items-center justify-between px-4 py-2.5 border-b"
              style={{ borderColor: dark ? "#27272a" : "#e4e4e7" }}
            >
              <div className="flex items-center gap-2">
                <Broadcast className="w-3.5 h-3.5" style={{ color: ACCENT }} weight="fill" />
                <span style={{ color: dark ? "#a1a1aa" : "#71717a" }} className="text-xs font-medium tracking-wide">
                  Live Threat Feed
                </span>
              </div>
              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide" style={{ color: ACCENT }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: ACCENT }} />
                Collecting
              </span>
            </div>
            <div className="p-4 font-mono text-xs space-y-2.5 h-52 overflow-hidden">
              <div style={{ color: dark ? "#52525b" : "#a1a1aa" }} className="mb-2">
                $ python main.py collect --limit 50
              </div>
              {FEED_LINES.slice(0, visible).map((line, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center gap-2.5"
                >
                  <span
                    className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold"
                    style={{ color: ACCENT, background: `${ACCENT}15`, border: `1px solid ${ACCENT}28` }}
                  >
                    {line.type}
                  </span>
                  <span style={{ color: dark ? "#d4d4d8" : "#3f3f46" }} className="truncate flex-1">
                    {line.value}
                  </span>
                  <span style={{ color: dark ? "#52525b" : "#a1a1aa" }} className="shrink-0 text-[10px]">
                    {line.src}
                  </span>
                </motion.div>
              ))}
              {visible < FEED_LINES.length && (
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                  className="inline-block w-1.5 h-3.5 rounded-sm"
                  style={{ background: ACCENT }}
                />
              )}
            </div>
          </motion.div>
        </div>
      </section>

      <SectionDivider />

      {/* ── Stats bar ──────────────────────────────────────────────────── */}
      <motion.section
        {...fadeIn()}
        className="py-6 px-6"
      >
        <div className="max-w-3xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4 text-center divide-x divide-zinc-200 dark:divide-zinc-800">
          {[
            { value: "6",    label: "IOC Types" },
            { value: "500+", label: "MITRE TTPs" },
            { value: "2",    label: "Threat Feeds" },
            { value: "4",    label: "TLP Levels" },
          ].map((s) => (
            <div key={s.label} className="px-4">
              <div className="text-2xl font-black text-zinc-900 dark:text-white mb-0.5">{s.value}</div>
              <div className="text-zinc-500 text-xs">{s.label}</div>
            </div>
          ))}
        </div>
      </motion.section>

      <SectionDivider />

      {/* ── Features ───────────────────────────────────────────────────── */}
      <section id="features" className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div {...fadeIn()} className="mb-10">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500 mb-3">Platform</p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900 dark:text-white mb-3">
              Every tool an analyst needs
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-base max-w-lg">
              From raw IOC collection to finished intelligence. One platform, full cycle.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                {...fadeIn(i * 0.05)}
                className={`group rounded-xl border border-zinc-200 dark:border-zinc-800/80 p-6 bg-white dark:bg-zinc-900/40 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors duration-200 ${f.wide ? "md:col-span-2" : ""}`}
              >
                {f.wide ? (
                  <div className="flex flex-col md:flex-row gap-6 h-full">
                    <div className="flex-1 min-w-0">
                      <div className="inline-flex p-2 rounded-lg mb-4 bg-zinc-100 dark:bg-zinc-800">
                        <f.Icon className="w-4 h-4" weight="bold" style={{ color: ACCENT }} />
                      </div>
                      <h3 className="text-zinc-900 dark:text-zinc-100 font-semibold text-sm mb-1.5">{f.title}</h3>
                      <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed mb-3">{f.desc}</p>
                      {f.tags && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {f.tags.map((t) => (
                            <span
                              key={t}
                              className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="hidden md:flex w-52 shrink-0 items-center border-l border-zinc-200 dark:border-zinc-800/50 pl-6">
                      <IocStreamPreview dark={dark} />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="inline-flex p-2 rounded-lg mb-4 bg-zinc-100 dark:bg-zinc-800">
                      <f.Icon className="w-4 h-4" weight="bold" style={{ color: ACCENT }} />
                    </div>
                    <h3 className="text-zinc-900 dark:text-zinc-100 font-semibold text-sm mb-1.5">{f.title}</h3>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed mb-3">{f.desc}</p>
                    {f.tags && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {f.tags.map((t) => (
                          <span
                            key={t}
                            className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ── How It Works ───────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div {...fadeIn()} className="mb-10">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500 mb-3">Intelligence Cycle</p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900 dark:text-white mb-3">
              The full cycle, automated
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-base max-w-lg mb-6">
              CTI Tracker implements the full intelligence production cycle: from raw data to actionable finished product.
            </p>
            <PipelineSvg dark={dark} />
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto_1fr] gap-4 items-start">
            {STEPS.map((s, i) => (
              <>
                <motion.div
                  key={s.num}
                  {...fadeIn(i * 0.08)}
                  className="rounded-xl border border-zinc-200 dark:border-zinc-800/80 p-6 bg-white dark:bg-zinc-900/40"
                >
                  <div className="flex items-start justify-between mb-5">
                    <div className="inline-flex p-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800">
                      <s.Icon className="w-4 h-4" weight="bold" style={{ color: ACCENT }} />
                    </div>
                    <span className="text-xs font-bold font-mono text-zinc-400 dark:text-zinc-600 select-none">{s.num}</span>
                  </div>
                  <h3 className="text-zinc-900 dark:text-zinc-100 font-semibold text-base mb-2">{s.title}</h3>
                  <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed">{s.desc}</p>
                </motion.div>

                {i < STEPS.length - 1 && (
                  <div key={`connector-${i}`} className="hidden md:flex items-center justify-center pt-10">
                    <div className="flex items-center gap-1" style={{ color: ACCENT, opacity: 0.35 }}>
                      <div className="h-px w-5 bg-current" />
                      <CaretRight className="w-3.5 h-3.5" weight="bold" />
                    </div>
                  </div>
                )}
              </>
            ))}
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ── Final CTA ──────────────────────────────────────────────────── */}
      <section className="relative py-20 px-6 overflow-hidden">
        <CtaRings />
        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <motion.div {...fadeIn()}>
            <div className="inline-flex p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 mb-6">
              <Shield className="w-7 h-7" weight="fill" style={{ color: ACCENT }} />
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900 dark:text-white mb-3">
              Ready to track threats?
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-base mb-8 max-w-sm mx-auto">
              Open the live dashboard to begin collecting, analyzing, and reporting on threat intelligence.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-7 py-3 rounded-lg font-semibold text-sm transition-opacity hover:opacity-90"
              style={{ background: ACCENT, color: "#09090b" }}
            >
              Open Dashboard <ArrowRight className="w-4 h-4" weight="bold" />
            </Link>
          </motion.div>
        </div>
      </section>

      <SectionDivider />

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="py-7 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-zinc-400 dark:text-zinc-600 text-xs">
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5" weight="fill" style={{ color: ACCENT }} />
            <span>CTI Tracker · GTAC-style threat intelligence platform</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span>MalwareBazaar</span><span className="text-zinc-300 dark:text-zinc-700">·</span>
            <span>URLhaus</span><span className="text-zinc-300 dark:text-zinc-700">·</span>
            <span>MITRE ATT&amp;CK</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
