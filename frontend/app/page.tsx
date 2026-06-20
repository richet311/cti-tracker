"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRightIcon as ArrowRight,
  CaretRightIcon as CaretRight,
} from "@phosphor-icons/react";

import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { ThreatGlobe } from "@/components/landing/ThreatGlobe";
import { ThreatRadar } from "@/components/landing/ThreatRadar";
import { ThreatMarquee } from "@/components/landing/ThreatMarquee";
import { CyclingWord } from "@/components/landing/CyclingWord";
import { StatCounter } from "@/components/landing/StatCounter";
import { SectionLabel } from "@/components/landing/SectionLabel";
import { SectionDivider } from "@/components/landing/SectionDivider";
import { IocStreamPreview } from "@/components/landing/IocStreamPreview";
import { PipelineFlow } from "@/components/landing/PipelineFlow";
import { TerminalDemo } from "@/components/landing/TerminalDemo";
import {
  ACCENT,
  CAPABILITIES,
  SOURCES,
  STEPS,
  STATS,
} from "@/components/landing/landing-constants";
import { fadeIn } from "@/components/landing/landing-utils";

export default function Landing() {
  const { data: session } = useSession();
  const authed = session != null;
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#d5d9e8] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 transition-colors duration-200">

      <LandingNavbar scrolled={scrolled} />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative pt-28 pb-20 px-6 overflow-hidden">
        <div
          aria-hidden
          className="absolute pointer-events-none"
          style={{
            top: "-20%", left: "-8%",
            width: 900, height: 700,
            background: `radial-gradient(ellipse at 40% 40%, ${ACCENT}18 0%, ${ACCENT}06 40%, transparent 70%)`,
            filter: "blur(52px)",
          }}
        />
        <div
          aria-hidden
          className="absolute pointer-events-none"
          style={{
            top: "8%", left: "8%",
            width: 500, height: 500,
            background: "radial-gradient(circle, #9f7aea09 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />

        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[580px]">

            <div>
              <motion.h1
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="text-5xl sm:text-6xl xl:text-7xl font-black tracking-tighter leading-[1.05] mb-5"
              >
                <span className="text-zinc-900 dark:text-white">Track. Analyze.</span>
                <br />
                <CyclingWord />
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.28 }}
                className="text-zinc-500 dark:text-zinc-400 text-lg max-w-md mb-10 leading-relaxed"
              >
                A full-stack CTI platform for analysts: real-time IOC collection,
                MITRE ATT&amp;CK mapping, and finished intelligence reports.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.38 }}
                className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-12"
              >
                <Link
                  href={authed ? "/dashboard" : "/login"}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-sm transition-all hover:brightness-110 active:scale-[0.98] cursor-pointer"
                  style={{ background: ACCENT, color: "#09090b", boxShadow: `0 0 24px ${ACCENT}35` }}
                >
                  {authed ? "Open Dashboard" : "Get Started"} <ArrowRight className="w-4 h-4" weight="bold" />
                </Link>
                <a
                  href="#capabilities"
                  className="flex items-center gap-1.5 px-6 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 text-sm font-medium hover:border-zinc-400 dark:hover:border-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
                >
                  See capabilities <CaretRight className="w-4 h-4" />
                </a>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                <PipelineFlow />
              </motion.div>
            </div>

            <div className="hidden lg:flex items-center justify-center relative">
              <motion.div
                initial={{ opacity: 0, scale: 0.88 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.1, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
              >
                <ThreatGlobe size={480} dark={true} />
              </motion.div>
              <div
                aria-hidden
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `radial-gradient(circle at 50% 50%, ${ACCENT}16 0%, ${ACCENT}08 35%, transparent 65%)`,
                }}
              />
            </div>
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ── Stats bar ────────────────────────────────────────────────────── */}
      <motion.section {...fadeIn()} className="py-10 px-6">
        <div className="max-w-3xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4 text-center divide-x divide-zinc-200 dark:divide-zinc-800/80">
          {STATS.map((s) => (
            <StatCounter key={s.label} value={s.value} suffix={s.suffix} label={s.label} />
          ))}
        </div>
      </motion.section>

      <ThreatMarquee />

      {/* ── Capabilities ─────────────────────────────────────────────────── */}
      <section id="capabilities" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div {...fadeIn()} className="mb-12">
            <SectionLabel>Capabilities</SectionLabel>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900 dark:text-white mb-3">
              Everything an analyst needs.<br />Nothing extra.
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-base max-w-lg">
              From raw feed collection to finished intelligence. One platform for the full production cycle.
            </p>
          </motion.div>

          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #27272a" }}>
            {CAPABILITIES.map((cap, i) => (
              <motion.div
                key={cap.num}
                {...fadeIn(i * 0.06)}
                className="group grid grid-cols-[52px_1fr] gap-4 p-6 relative overflow-hidden transition-colors duration-200 cursor-default"
                style={{
                  background: "#111114",
                  borderBottom: i < CAPABILITIES.length - 1 ? "1px solid #27272a" : undefined,
                }}
              >
                <div
                  className="absolute left-0 inset-y-0 w-[2px] transition-all duration-300 scale-y-0 group-hover:scale-y-100 origin-center"
                  style={{ background: `linear-gradient(180deg, transparent, ${ACCENT}90, transparent)` }}
                />
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{ background: `linear-gradient(90deg, ${ACCENT}07 0%, transparent 50%)` }}
                />

                <div className="pt-0.5 select-none relative z-10">
                  <span className="text-4xl font-black leading-none" style={{ color: "#27272a" }}>
                    {cap.num}
                  </span>
                </div>

                <div className="flex flex-col md:flex-row gap-6 relative z-10">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 mb-2.5">
                      <cap.Icon className="w-4 h-4 shrink-0" weight="bold" style={{ color: ACCENT }} />
                      <h3 className="text-zinc-100 font-semibold text-sm">{cap.title}</h3>
                    </div>
                    <p className="text-zinc-400 text-sm leading-relaxed mb-3">{cap.desc}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {cap.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                          style={{ background: "#1a1a1f", color: "#71717a", border: "1px solid #2a2a30" }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {cap.showPreview && (
                    <div className="hidden md:flex w-52 shrink-0 items-center">
                      <IocStreamPreview />
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ── Live Collection Demo ──────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <motion.div {...fadeIn()}>
              <SectionLabel>Live Collection</SectionLabel>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900 dark:text-white mb-4">
                Watch threats stream<br />in real time.
              </h2>
              <p className="text-zinc-500 dark:text-zinc-400 text-base leading-relaxed">
                Hit collect and watch IOCs stream live from MalwareBazaar and URLhaus
                via WebSocket: SHA256 hashes, malicious URLs, IPs, and domains as they arrive.
              </p>
            </motion.div>

            <motion.div {...fadeIn(0.1)}>
              <TerminalDemo />
            </motion.div>
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ── Sources ──────────────────────────────────────────────────────── */}
      <section id="sources" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div {...fadeIn()} className="mb-12">
            <SectionLabel>Data Sources</SectionLabel>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900 dark:text-white mb-3">
              Works with the feeds<br />you already monitor.
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-base max-w-lg">
              Pre-built integrations with the most trusted open-source threat intelligence providers.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {SOURCES.map((src, i) => (
              <motion.div
                key={src.name}
                {...fadeIn(i * 0.07)}
                className="group rounded-xl p-5 relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 cursor-default"
                style={{ background: "#111114", border: "1px solid #27272a" }}
                whileHover={{ boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px ${src.color}25` }}
              >
                <div
                  className="absolute inset-x-0 top-0 h-[1px]"
                  style={{ background: `linear-gradient(90deg, transparent, ${src.color}60, transparent)` }}
                />
                <div
                  className="absolute top-0 left-0 w-24 h-24 pointer-events-none"
                  style={{ background: `radial-gradient(circle at 0% 0%, ${src.color}0a, transparent 70%)` }}
                />

                <div className="flex items-start justify-between mb-4 relative">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-[10px] font-bold font-mono shrink-0"
                      style={{ background: `${src.color}12`, border: `1px solid ${src.color}30`, color: src.color }}
                    >
                      {src.abbr}
                    </div>
                    <span className="text-zinc-100 font-semibold text-sm leading-tight">{src.name}</span>
                  </div>
                  <span
                    className="text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full shrink-0 ml-2"
                    style={{ color: src.color, background: `${src.color}15` }}
                  >
                    {src.status}
                  </span>
                </div>
                <p className="text-zinc-400 text-xs leading-relaxed relative">{src.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ── How It Works ─────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div {...fadeIn()} className="mb-12">
            <SectionLabel>Intelligence Cycle</SectionLabel>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900 dark:text-white mb-3">
              Three steps.<br />Infinite context.
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-base max-w-lg">
              CTI Tracker implements the full intelligence production cycle, from raw data to actionable finished product.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.num}
                {...fadeIn(i * 0.08)}
                className="rounded-xl p-6 relative overflow-hidden group cursor-default"
                style={{ background: "#111114", border: "1px solid #27272a" }}
                whileHover={{ borderColor: `${ACCENT}30`, boxShadow: `0 8px 32px rgba(0,0,0,0.4)` }}
                transition={{ duration: 0.2 }}
              >
                <div
                  className="absolute right-3 top-2 font-black select-none pointer-events-none leading-none"
                  style={{ fontSize: 72, color: "#1a1a1f", lineHeight: 1 }}
                >
                  {s.num}
                </div>
                <div
                  className="absolute inset-x-0 top-0 h-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: `linear-gradient(90deg, transparent, ${ACCENT}50, transparent)` }}
                />
                <div className="mb-5">
                  <s.Icon className="w-6 h-6" weight="bold" style={{ color: ACCENT }} />
                </div>
                <h3 className="text-zinc-100 font-bold text-base mb-2 relative">{s.title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed relative">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 overflow-hidden relative">
        <div
          aria-hidden
          className="absolute pointer-events-none"
          style={{
            top: "50%", left: "30%",
            transform: "translate(-50%, -50%)",
            width: 700, height: 700,
            background: `radial-gradient(ellipse at center, ${ACCENT}0d 0%, ${ACCENT}04 40%, transparent 70%)`,
            filter: "blur(40px)",
          }}
        />
        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div
            {...fadeIn()}
            className="grid grid-cols-1 md:grid-cols-[1fr_auto] items-center"
          >
            <div className="py-6 md:py-10">
              <SectionLabel>Get started</SectionLabel>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-4">
                Intelligence production,<br />start to finish.
              </h2>
              <p className="text-zinc-400 text-base mb-8 leading-relaxed max-w-sm">
                Open the dashboard, run your first collection, and start building
                threat intelligence in minutes.
              </p>
            </div>

            <div className="hidden md:flex items-center justify-center" style={{ width: 460, height: 420 }}>
              <ThreatRadar size={390} dark={true} />
            </div>
          </motion.div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
