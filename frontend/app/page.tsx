"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useInView, animate, AnimatePresence } from "framer-motion";
import {
  ArrowRightIcon as ArrowRight,
  SunIcon as Sun,
  MoonIcon as Moon,
  DatabaseIcon as Database,
  BroadcastIcon as Broadcast,
  CrosshairIcon as Crosshair,
  UsersThreeIcon as UsersThree,
  MagnifyingGlassIcon as MagnifyingGlass,
  FileTextIcon as FileText,
  CaretRightIcon as CaretRight,
} from "@phosphor-icons/react";

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

const CYCLE_WORDS = ["Neutralize", "Attribute", "Report"];

const MARQUEE_ITEMS = [
  "COBALT STRIKE", "SHA-256", "YARA RULES", "TLP:RED", "C2 FRAMEWORK",
  "MIMIKATZ", "APT29", "LAZARUS GROUP", "SIGMA RULES",
  "IOC TRACKING", "TTP MAPPING", "EMOTET", "QAKBOT",
  "MITRE ATT&CK", "MALWARE BAZAAR", "URLHAUS", "THREAT HUNTING",
];

const CAPABILITIES = [
  {
    num: "01",
    title: "Live IOC Collection",
    Icon: Broadcast,
    desc: "WebSocket-powered streaming from MalwareBazaar and URLhaus. Watch indicators appear in real time as they're pulled from active threat feeds.",
    tags: ["MalwareBazaar", "URLhaus", "WebSocket"],
    showPreview: true,
  },
  {
    num: "02",
    title: "MITRE ATT&CK Mapping",
    Icon: Crosshair,
    desc: "Map adversary techniques to the MITRE ATT&CK framework. Search TTPs by ID or keyword and attach them directly to campaigns.",
    tags: ["500+ Techniques", "TTP Search", "Campaign Enrichment"],
    showPreview: false,
  },
  {
    num: "03",
    title: "Campaign Tracking",
    Icon: UsersThree,
    desc: "Group IOCs into adversary campaigns. Track threat actors, motivations, and link associated TTPs for full situational awareness.",
    tags: ["Threat Actors", "Motivation", "Status Tracking"],
    showPreview: false,
  },
  {
    num: "04",
    title: "Intelligence Reports",
    Icon: FileText,
    desc: "TLP-classified tactical and flash reports with executive summaries, IOC blocklists, and defensive recommendations.",
    tags: ["TLP WHITE", "TLP GREEN", "TLP AMBER", "TLP RED"],
    showPreview: false,
  },
];

const STEPS = [
  {
    num: "01",
    title: "Collect",
    Icon: Database,
    desc: "Pull IOCs from live threat feeds via WebSocket. MalwareBazaar samples and URLhaus URLs stream directly into your local database in real time.",
  },
  {
    num: "02",
    title: "Analyze",
    Icon: MagnifyingGlass,
    desc: "Auto-classify indicators, suggest campaign groupings based on shared malware families, and map techniques to MITRE ATT&CK.",
  },
  {
    num: "03",
    title: "Report",
    Icon: FileText,
    desc: "Generate TLP-classified intelligence: tactical reports with executive summaries, blocklists, and defensive recommendations.",
  },
];

const SOURCES = [
  {
    abbr: "MB",
    name: "MalwareBazaar",
    color: "#00c8ff",
    status: "Active",
    desc: "Hash-based IOCs. SHA256, MD5, and SHA1 from daily malware sample submissions.",
  },
  {
    abbr: "UH",
    name: "URLhaus",
    color: "#ff6b35",
    status: "Active",
    desc: "Malicious URLs and domains from community-submitted threat intelligence reports.",
  },
  {
    abbr: "TTP",
    name: "MITRE ATT&CK",
    color: "#9f7aea",
    status: "Framework",
    desc: "500+ adversary techniques for TTP mapping, procedure tagging, and campaign enrichment.",
  },
];

const STATS = [
  { value: "6",   suffix: "",  label: "IOC Types" },
  { value: "500", suffix: "+", label: "MITRE TTPs" },
  { value: "2",   suffix: "",  label: "Threat Feeds" },
  { value: "4",   suffix: "",  label: "TLP Levels" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function fadeIn(delay = 0) {
  return {
    initial: { opacity: 0, y: 16 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-40px" },
    transition: { duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] },
  };
}

// ── Brand Mark ───────────────────────────────────────────────────────────────

function BrandMark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 2.5L20 6.5V13.5C20 17.6 16.5 21.3 12 22.5C7.5 21.3 4 17.6 4 13.5V6.5L12 2.5Z"
        stroke="#00c8ff"
        strokeWidth="1.4"
        strokeLinejoin="round"
        fill="#00c8ff14"
      />
      <circle cx="12" cy="13" r="2" fill="#00c8ff" />
      <line x1="12" y1="8.5" x2="12" y2="11" stroke="#00c8ff" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="12" y1="15" x2="12" y2="17.5" stroke="#00c8ff" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="7.5" y1="13" x2="10" y2="13" stroke="#00c8ff" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="14" y1="13" x2="16.5" y2="13" stroke="#00c8ff" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

// ── Threat Globe ──────────────────────────────────────────────────────────────

function ThreatGlobe({ size = 480, dark = true }: { size?: number; dark?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const darkRef   = useRef(dark);

  useEffect(() => { darkRef.current = dark; }, [dark]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width  = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width  = `${size}px`;
    canvas.style.height = `${size}px`;

    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);

    const cx = size / 2, cy = size / 2, R = size * 0.34;

    // Fibonacci sphere surface dots
    const N = 420;
    const golden = Math.PI * (3 - Math.sqrt(5));
    const surface = Array.from({ length: N }, (_, i) => {
      const y = 1 - (i / (N - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const theta = golden * i;
      return { bx: Math.cos(theta) * r, by: y, bz: Math.sin(theta) * r };
    });

    // Latitude lines at -40°, 0°, 40°
    const latAngles = [-0.698, 0, 0.698];
    const latLines = latAngles.map((lat) => {
      const yN = Math.sin(lat), rN = Math.cos(lat);
      return Array.from({ length: 80 }, (_, i) => {
        const t = (i / 80) * Math.PI * 2;
        return { bx: rN * Math.cos(t), by: yN, bz: rN * Math.sin(t) };
      });
    });

    // Longitude lines every 60°
    const lonLines = [0, 1.047, 2.094, 3.14, 4.189, 5.236].map((lon) =>
      Array.from({ length: 60 }, (_, i) => {
        const lat = (i / 59) * Math.PI - Math.PI / 2;
        return {
          bx: Math.cos(lat) * Math.cos(lon),
          by: Math.sin(lat),
          bz: Math.cos(lat) * Math.sin(lon),
        };
      })
    );

    // Threat hotspot nodes — biased toward mid-latitudes
    const hotspots = Array.from({ length: 14 }, () => {
      const phi   = Math.acos(2 * Math.random() - 1);
      const yBias = Math.cos(phi) * 0.72;
      const rBias = Math.sqrt(1 - yBias * yBias);
      const t2    = Math.random() * Math.PI * 2;
      return {
        bx: rBias * Math.cos(t2),
        by: yBias,
        bz: rBias * Math.sin(t2),
        pulse: Math.random() * Math.PI * 2,
        sz: 1.6 + Math.random() * 1.4,
      };
    });

    interface Arc {
      si: number; di: number;
      prog: number; speed: number; len: number;
    }
    const arcs: Arc[] = [];

    function spawnArc() {
      if (arcs.length >= 3) return;
      const si = Math.floor(Math.random() * hotspots.length);
      let di: number;
      do { di = Math.floor(Math.random() * hotspots.length); } while (di === si);
      arcs.push({ si, di, prog: 0, speed: 0.005 + Math.random() * 0.005, len: 420 + Math.random() * 140 });
    }

    function proj(bx: number, by: number, bz: number, cY: number, sY: number) {
      const rx = bx * cY + bz * sY;
      const rz = -bx * sY + bz * cY;
      const p  = (rz + 2.6) / 3.6;
      return { x: cx + rx * R * p, y: cy + by * R * p, z: rz, p };
    }

    function drawGridLine(pts: { bx: number; by: number; bz: number }[], cY: number, sY: number, alpha: number, isDark: boolean) {
      let started = false;
      ctx.beginPath();
      for (const { bx, by, bz } of pts) {
        const { x, y, z } = proj(bx, by, bz, cY, sY);
        if (z < -0.05) { started = false; continue; }
        if (!started) { ctx.moveTo(x, y); started = true; }
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = isDark
        ? `rgba(0,200,255,${alpha})`
        : `rgba(0,100,180,${(alpha * 1.4).toFixed(3)})`;
      ctx.lineWidth = 0.35;
      ctx.stroke();
    }

    let rotY = 0, frame = 0, raf: number;

    function draw() {
      ctx.clearRect(0, 0, size, size);
      frame++;
      rotY += 0.0016;
      const cY = Math.cos(rotY), sY = Math.sin(rotY);
      const isDark = darkRef.current;
      const now = Date.now() / 1000;

      if (frame % 100 === 5 || (arcs.length === 0 && frame % 30 === 0)) spawnArc();

      // 1 — surface dots (depth-sorted)
      surface
        .map(({ bx, by, bz }) => proj(bx, by, bz, cY, sY))
        .filter(p => p.z > -0.72)
        .sort((a, b) => a.z - b.z)
        .forEach(({ x, y, z, p }) => {
          const t = (z + 1) / 2;
          const r = (0.7 + t * 0.8) * p;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fillStyle = isDark
            ? `rgba(0,200,255,${(0.04 + t * 0.2).toFixed(3)})`
            : `rgba(0,100,180,${(0.07 + t * 0.26).toFixed(3)})`;
          ctx.fill();
        });

      // 2 — lat/lon grid lines
      ctx.save();
      ctx.setLineDash([]);
      latLines.forEach(pts => drawGridLine(pts, cY, sY, 0.07, isDark));
      lonLines.forEach(pts => drawGridLine(pts, cY, sY, 0.05, isDark));
      ctx.restore();

      // 3 — connection arcs
      for (let i = arcs.length - 1; i >= 0; i--) {
        const arc = arcs[i];
        arc.prog += arc.speed;
        if (arc.prog >= 2.0) { arcs.splice(i, 1); continue; }

        const h1 = hotspots[arc.si], h2 = hotspots[arc.di];
        const p1 = proj(h1.bx, h1.by, h1.bz, cY, sY);
        const p2 = proj(h2.bx, h2.by, h2.bz, cY, sY);

        if (p1.z < -0.05 || p2.z < -0.05) continue;

        const midX = (p1.x + p2.x) / 2, midY = (p1.y + p2.y) / 2;
        const dvx = midX - cx, dvy = midY - cy;
        const dvL = Math.sqrt(dvx * dvx + dvy * dvy) || 1;
        const cpX = midX + (dvx / dvL) * R * 0.38;
        const cpY = midY + (dvy / dvL) * R * 0.38;

        const drawProg  = Math.min(arc.prog, 1.0);
        const fadeAlpha = arc.prog > 1.25 ? Math.max(0, 1 - (arc.prog - 1.25) / 0.75) : 1;
        const drawnLen  = drawProg * arc.len;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.quadraticCurveTo(cpX, cpY, p2.x, p2.y);
        ctx.setLineDash([drawnLen, arc.len + 40]);
        ctx.lineDashOffset = 0;
        ctx.lineWidth = 0.9;
        ctx.strokeStyle = isDark
          ? `rgba(0,210,255,${(0.55 * fadeAlpha).toFixed(3)})`
          : `rgba(0,110,190,${(0.65 * fadeAlpha).toFixed(3)})`;
        ctx.stroke();

        // travelling dot at arc tip during draw phase
        if (arc.prog < 1.0) {
          const t = drawProg;
          const dotX = (1-t)*(1-t)*p1.x + 2*(1-t)*t*cpX + t*t*p2.x;
          const dotY = (1-t)*(1-t)*p1.y + 2*(1-t)*t*cpY + t*t*p2.y;
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.arc(dotX, dotY, 1.8, 0, Math.PI * 2);
          ctx.fillStyle = isDark ? "rgba(0,230,255,0.92)" : "rgba(0,130,210,0.92)";
          ctx.fill();
        }
        ctx.restore();
      }

      // 4 — hotspot nodes
      hotspots.forEach(({ bx, by, bz, pulse, sz }) => {
        const { x, y, z, p: pFactor } = proj(bx, by, bz, cY, sY);
        if (z < -0.35) return;
        const depthT = (z + 1) / 2;
        const sin    = (Math.sin(now * 2.2 + pulse) + 1) / 2;

        // outer pulse ring
        ctx.beginPath();
        ctx.arc(x, y, (5 + sin * 5) * pFactor, 0, Math.PI * 2);
        ctx.strokeStyle = isDark
          ? `rgba(0,200,255,${((0.1 + sin * 0.18) * depthT).toFixed(3)})`
          : `rgba(0,100,180,${((0.15 + sin * 0.22) * depthT).toFixed(3)})`;
        ctx.lineWidth = 0.7;
        ctx.stroke();

        // inner dot
        ctx.beginPath();
        ctx.arc(x, y, sz * pFactor, 0, Math.PI * 2);
        ctx.fillStyle = isDark
          ? `rgba(0,220,255,${(0.6 + depthT * 0.4).toFixed(3)})`
          : `rgba(0,120,200,${(0.65 + depthT * 0.35).toFixed(3)})`;
        ctx.fill();
      });

      raf = requestAnimationFrame(draw);
    }

    spawnArc();
    draw();
    return () => cancelAnimationFrame(raf);
  }, [size]);

  return <canvas ref={canvasRef} aria-hidden />;
}

// ── Decorative ────────────────────────────────────────────────────────────────

function SectionDivider() {
  return <div className="w-full h-px bg-gradient-to-r from-transparent via-[#00c8ff]/15 to-transparent" />;
}

function SectionLabel({ children }: { children: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <div className="h-px w-6 shrink-0" style={{ background: `linear-gradient(90deg, ${ACCENT}, transparent)` }} />
      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">{children}</span>
    </div>
  );
}

// ── Cycling Word ──────────────────────────────────────────────────────────────

function CyclingWord() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % CYCLE_WORDS.length), 2800);
    return () => clearInterval(t);
  }, []);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={idx}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -14 }}
        transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
        className="inline-block"
        style={{
          background: `linear-gradient(125deg, #80eeff 0%, ${ACCENT} 40%, #38cfff 100%)`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          paddingBottom: "0.2em",
        }}
      >
        {CYCLE_WORDS[idx]}
      </motion.span>
    </AnimatePresence>
  );
}

// ── Threat Radar ──────────────────────────────────────────────────────────────

function ThreatRadar({ size = 400, dark = true }: { size?: number; dark?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const darkRef   = useRef(dark);

  useEffect(() => { darkRef.current = dark; }, [dark]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width  = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width  = `${size}px`;
    canvas.style.height = `${size}px`;

    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);

    const cx = size / 2, cy = size / 2, R = size * 0.42;

    const LABELS = ["APT29", "LAZARUS", "COBALT", "C2", "IOC", "SHA256", "URL", "MD5", "APT28", "FIN7"];

    interface Blip {
      angle: number; dist: number; alpha: number; sz: number; label: string;
    }

    const blips: Blip[] = Array.from({ length: 11 }, () => ({
      angle: Math.random() * Math.PI * 2,
      dist:  0.16 + Math.random() * 0.74,
      alpha: Math.random() * 0.25,
      sz:    2.0 + Math.random() * 2.2,
      label: LABELS[Math.floor(Math.random() * LABELS.length)],
    }));

    let sweepAngle = 0, raf: number;

    function draw() {
      ctx.clearRect(0, 0, size, size);
      const isDark = darkRef.current;
      const [ar, ag, ab] = isDark ? [0, 200, 255] : [0, 100, 180];

      sweepAngle = (sweepAngle + 0.013) % (Math.PI * 2);

      // Background disk
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = isDark ? "rgba(4,8,16,0.94)" : "rgba(238,244,250,0.94)";
      ctx.fill();

      // Concentric rings
      for (let i = 1; i <= 4; i++) {
        ctx.beginPath();
        ctx.arc(cx, cy, R * i / 4, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${ar},${ag},${ab},${isDark ? 0.08 : 0.11})`;
        ctx.lineWidth = 0.6;
        ctx.stroke();
      }

      // Grid spokes
      ctx.save();
      ctx.setLineDash([3, 6]);
      ctx.strokeStyle = `rgba(${ar},${ag},${ab},${isDark ? 0.06 : 0.09})`;
      ctx.lineWidth = 0.5;
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.restore();

      // Sweep trail (clip to disk)
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R - 1, 0, Math.PI * 2);
      ctx.clip();
      const trailLen = Math.PI * 0.55;
      const STEPS = 28;
      for (let i = 0; i < STEPS; i++) {
        const t  = i / STEPS;
        const a0 = sweepAngle - trailLen * (1 - t);
        const a1 = sweepAngle - trailLen * (1 - t - 1 / STEPS);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, R, a0, a1);
        ctx.closePath();
        ctx.fillStyle = `rgba(${ar},${ag},${ab},${(t * t * (isDark ? 0.24 : 0.18)).toFixed(3)})`;
        ctx.fill();
      }
      ctx.restore();

      // Leading sweep edge
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(sweepAngle) * R, cy + Math.sin(sweepAngle) * R);
      ctx.strokeStyle = `rgba(${ar},${ag},${ab},0.85)`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Blips
      for (const blip of blips) {
        let diff = sweepAngle - blip.angle;
        while (diff < 0) diff += Math.PI * 2;
        if (diff < 0.07) blip.alpha = 1.0;
        else blip.alpha = Math.max(0, blip.alpha - 0.003);
        if (blip.alpha < 0.02) continue;

        const bx = cx + Math.cos(blip.angle) * blip.dist * R;
        const by = cy + Math.sin(blip.angle) * blip.dist * R;

        // Glow halo
        const grd = ctx.createRadialGradient(bx, by, 0, bx, by, blip.sz * 5);
        grd.addColorStop(0, `rgba(${ar},${ag},${ab},${(blip.alpha * 0.45).toFixed(3)})`);
        grd.addColorStop(1, `rgba(${ar},${ag},${ab},0)`);
        ctx.beginPath();
        ctx.arc(bx, by, blip.sz * 5, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();

        // Core dot
        ctx.beginPath();
        ctx.arc(bx, by, blip.sz, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${ar},${ag},${ab},${(blip.alpha * 0.95).toFixed(3)})`;
        ctx.fill();

        // Label (only when bright)
        if (blip.alpha > 0.35) {
          ctx.font = "bold 7.5px monospace";
          ctx.fillStyle = `rgba(${ar},${ag},${ab},${(blip.alpha * 0.65).toFixed(3)})`;
          ctx.fillText(blip.label, bx + blip.sz + 4, by - 1);
        }
      }

      // Center pip
      ctx.beginPath();
      ctx.arc(cx, cy, 2.8, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${ar},${ag},${ab},0.8)`;
      ctx.fill();

      // Outer ring border
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${ar},${ag},${ab},0.18)`;
      ctx.lineWidth = 1;
      ctx.stroke();

      raf = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(raf);
  }, [size]);

  return <canvas ref={canvasRef} aria-hidden />;
}

// ── Threat Marquee ────────────────────────────────────────────────────────────

function ThreatMarquee() {
  const items = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];
  return (
    <div
      className="overflow-hidden py-3"
      style={{ background: "#07070a", borderTop: "1px solid #18181b", borderBottom: "1px solid #18181b" }}
    >
      <div
        className="flex gap-10 whitespace-nowrap"
        style={{ animation: "marquee-left 38s linear infinite" }}
      >
        {items.map((item, i) => (
          <span
            key={i}
            className="text-[9px] font-mono font-bold uppercase tracking-[0.22em] shrink-0 flex items-center gap-2.5"
            style={{ color: "#52525b" }}
          >
            <span style={{ color: ACCENT, opacity: 0.4, fontSize: 12 }}>·</span>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Terminal Demo (scroll-triggered) ─────────────────────────────────────────

function TerminalDemo() {
  const ref    = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [visible, setVisible] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const t = setInterval(() => {
      setVisible((v) => {
        if (v >= FEED_LINES.length) { clearInterval(t); return v; }
        return v + 1;
      });
    }, 720);
    return () => clearInterval(t);
  }, [inView]);

  return (
    <div
      ref={ref}
      className="rounded-xl overflow-hidden text-left"
      style={{
        background: "#0e0e12",
        boxShadow: `0 32px 80px rgba(0,0,0,0.55), 0 0 0 1px #27272a, 0 0 60px ${ACCENT}10`,
        borderTop: `1px solid ${ACCENT}50`,
      }}
    >
      <div
        className="flex items-center justify-between px-4 py-2.5 border-b"
        style={{ borderColor: "#1f1f27", background: "#131318" }}
      >
        <div className="flex items-center gap-2">
          <span style={{ color: "#71717a" }} className="text-[11px] font-mono">
            threat-intel-collector
          </span>
        </div>
        <span
          className="flex items-center gap-1.5 text-[10px] font-bold font-mono uppercase tracking-wider px-2 py-0.5 rounded-full"
          style={{ color: ACCENT, background: `${ACCENT}14`, border: `1px solid ${ACCENT}30` }}
        >
          <motion.span
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ repeat: Infinity, duration: 1.4 }}
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: ACCENT, display: "inline-block" }}
          />
          live
        </span>
      </div>

      <div className="px-4 pt-3 pb-1 font-mono">
        <div className="text-[11px] mb-3 flex items-center gap-2">
          <span style={{ color: "#3f3f46" }}>~/cti</span>
          <span style={{ color: ACCENT, opacity: 0.5 }}>$</span>
          <span style={{ color: "#52525b" }}>python main.py collect --limit 50</span>
        </div>
      </div>

      <div className="px-4 pb-4 font-mono text-xs space-y-2 h-44 overflow-hidden">
        {FEED_LINES.slice(0, visible).map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.18 }}
            className="flex items-center gap-2.5"
          >
            <span
              className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold"
              style={{ color: ACCENT, background: `${ACCENT}14`, border: `1px solid ${ACCENT}28` }}
            >
              {line.type}
            </span>
            <span style={{ color: "#a1a1aa" }} className="truncate flex-1">{line.value}</span>
            <span style={{ color: "#3f3f46" }} className="shrink-0 text-[10px]">{line.src}</span>
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
    </div>
  );
}

// ── IocStreamPreview ──────────────────────────────────────────────────────────

function IocStreamPreview() {
  const rows = [
    { type: "SHA256", value: "a1b2c3d4e5f6a1b2...", src: "MB" },
    { type: "URL",    value: "http://malicious-c2.ru/payload...", src: "UH" },
    { type: "IP",     value: "185.220.101.47", src: "UH" },
    { type: "MD5",    value: "5f4dcc3b5aa765d6...", src: "MB" },
  ];
  return (
    <div
      className="rounded-lg overflow-hidden text-[10px] font-mono w-full"
      style={{ border: "1px solid #3f3f46" }}
    >
      <div
        className="flex items-center justify-between px-3 py-2 border-b"
        style={{ background: "#18181b", borderColor: "#3f3f46" }}
      >
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: ACCENT }} />
          <span style={{ color: "#a1a1aa" }} className="tracking-wide">ioc_stream</span>
        </div>
        <span style={{ color: ACCENT }} className="opacity-70">4 new</span>
      </div>
      {rows.map((row, i) => (
        <div
          key={i}
          className="flex items-center gap-2 px-3 py-1.5 border-b last:border-0"
          style={{ background: "#111114", borderColor: "#27272a" }}
        >
          <span
            className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold"
            style={{ color: ACCENT, background: `${ACCENT}14`, border: `1px solid ${ACCENT}26` }}
          >
            {row.type}
          </span>
          <span style={{ color: "#a1a1aa" }} className="truncate flex-1">{row.value}</span>
          <span style={{ color: "#52525b" }} className="shrink-0">{row.src}</span>
        </div>
      ))}
    </div>
  );
}

// ── PipelineFlow ──────────────────────────────────────────────────────────────

function PipelineFlow() {
  const nodes = [
    { label: "COLLECT", Icon: Database },
    { label: "ANALYZE", Icon: MagnifyingGlass },
    { label: "REPORT",  Icon: FileText },
  ];
  return (
    <div className="flex items-center gap-0">
      {nodes.map((n, i) => (
        <div key={n.label} className="flex items-center">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.12, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
            style={{
              background: "#18181b",
              border: `1px solid ${ACCENT}35`,
              boxShadow: `0 0 24px ${ACCENT}10`,
            }}
          >
            <n.Icon className="w-3.5 h-3.5" weight="bold" style={{ color: ACCENT, opacity: 0.9 }} />
            <span className="text-[10px] font-mono font-bold tracking-[0.14em]" style={{ color: ACCENT }}>
              {n.label}
            </span>
          </motion.div>
          {i < nodes.length - 1 && (
            <motion.div
              className="flex items-center px-1"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 + 0.2 }}
            >
              <span style={{ color: ACCENT, opacity: 0.55, fontSize: 18, lineHeight: 1, letterSpacing: "-0.02em", fontWeight: 300 }}>→</span>
            </motion.div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── StatCounter ───────────────────────────────────────────────────────────────

function StatCounter({ value, suffix, label }: { value: string; suffix: string; label: string }) {
  const ref    = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    if (!inView) return;
    const target = parseInt(value);
    const ctrl = animate(0, target, {
      duration: 1.4,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(Math.round(v) + suffix),
    });
    return () => ctrl.stop();
  }, [inView, value, suffix]);

  return (
    <div ref={ref} className="px-4 flex flex-col items-center">
      <div
        className="text-3xl font-black mb-1 tabular-nums"
        style={{
          background: `linear-gradient(135deg, #80eeff 0%, ${ACCENT} 55%, #38cfff 100%)`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        {display}
      </div>
      <div className="text-zinc-500 text-xs tracking-wide">{label}</div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Landing() {
  const [dark, setDark] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMounted(true);
    const saved   = localStorage.getItem("cti-theme");
    const isDark  = saved !== "light";
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("cti-theme", next ? "dark" : "light");
  }

  return (
    <div className="min-h-screen bg-[#d5d9e8] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 transition-colors duration-200">

      {/* ── Navbar ─────────────────────────────────────────────────────── */}
      <nav className={`fixed top-0 inset-x-0 z-50 h-14 flex items-center justify-between px-6 sm:px-10 transition-all duration-300 ${
        scrolled
          ? "border-b border-zinc-200/80 dark:border-zinc-900 bg-[#d5d9e8]/90 dark:bg-[#09090b]/90 backdrop-blur-xl"
          : "border-b border-transparent"
      }`}>
        <div className="flex items-center gap-2">
          <BrandMark size={20} />
          <span className="font-bold tracking-tight text-sm">
            <span className="text-zinc-900 dark:text-zinc-100">CTI</span>
            <span style={{ color: ACCENT }}>Tracker</span>
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-7 text-sm text-zinc-500 dark:text-zinc-400">
          <a href="#capabilities" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer">Capabilities</a>
          <a href="#how-it-works" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer">How it works</a>
          <a href="#sources" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer">Sources</a>
        </div>

        <div className="flex items-center gap-2">
          {mounted && (
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          )}
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-semibold transition-all hover:brightness-110 cursor-pointer"
            style={{ background: ACCENT, color: "#09090b" }}
          >
            Dashboard <ArrowRight className="w-3.5 h-3.5" weight="bold" />
          </Link>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="relative pt-28 pb-20 px-6 overflow-hidden">
        {/* Aurora orbs */}
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

            {/* ── Left: text + CTAs ─────────────────────────────────────── */}
            <div>
              {/* Headline */}
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
                  href="/dashboard"
                  className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-sm transition-all hover:brightness-110 active:scale-[0.98] cursor-pointer"
                  style={{ background: ACCENT, color: "#09090b", boxShadow: `0 0 24px ${ACCENT}35` }}
                >
                  Open Dashboard <ArrowRight className="w-4 h-4" weight="bold" />
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

            {/* ── Right: particle sphere ─────────────────────────────────── */}
            <div className="hidden lg:flex items-center justify-center relative">
              <motion.div
                initial={{ opacity: 0, scale: 0.88 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.1, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
              >
                <ThreatGlobe size={480} dark={dark} />
              </motion.div>
              {/* Glow halo behind sphere */}
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

      {/* ── Stats bar ──────────────────────────────────────────────────── */}
      <motion.section {...fadeIn()} className="py-10 px-6">
        <div className="max-w-3xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4 text-center divide-x divide-zinc-200 dark:divide-zinc-800/80">
          {STATS.map((s) => (
            <StatCounter key={s.label} value={s.value} suffix={s.suffix} label={s.label} />
          ))}
        </div>
      </motion.section>

      {/* ── Threat Marquee ─────────────────────────────────────────────── */}
      <ThreatMarquee />

      {/* ── Capabilities ───────────────────────────────────────────────── */}
      <section id="capabilities" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div {...fadeIn()} className="mb-12">
            <SectionLabel>Capabilities</SectionLabel>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900 dark:text-white mb-3">
              Everything an analyst needs.<br />Nothing extra.
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-base max-w-lg">
              From raw feed collection to finished intelligence — one platform for the full production cycle.
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

      {/* ── Live Collection Demo ────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <motion.div {...fadeIn()}>
              <SectionLabel>Live Collection</SectionLabel>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900 dark:text-white mb-4">
                Watch threats stream<br />in real time.
              </h2>
              <p className="text-zinc-500 dark:text-zinc-400 text-base leading-relaxed mb-8">
                Hit collect and watch IOCs stream live from MalwareBazaar and URLhaus
                via WebSocket — SHA256 hashes, malicious URLs, IPs, and domains as they arrive.
              </p>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all hover:brightness-110 active:scale-[0.98] cursor-pointer"
                style={{ background: ACCENT, color: "#09090b", boxShadow: `0 0 20px ${ACCENT}30` }}
              >
                Open Dashboard <ArrowRight className="w-4 h-4" weight="bold" />
              </Link>
            </motion.div>

            <motion.div {...fadeIn(0.1)}>
              <TerminalDemo />
            </motion.div>
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ── Sources ────────────────────────────────────────────────────── */}
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

      {/* ── How It Works ───────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div {...fadeIn()} className="mb-12">
            <SectionLabel>Intelligence Cycle</SectionLabel>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900 dark:text-white mb-3">
              Three steps.<br />Infinite context.
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-base max-w-lg">
              CTI Tracker implements the full intelligence production cycle — from raw data to actionable finished product.
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

      {/* ── Final CTA with particle cone ───────────────────────────────── */}
      <section className="py-24 px-6 overflow-hidden">
        <div className="max-w-5xl mx-auto">
          <motion.div
            {...fadeIn()}
            className="rounded-2xl overflow-hidden relative"
            style={{
              border: "1px solid #27272a",
              borderTop: `1px solid ${ACCENT}28`,
              background: "linear-gradient(145deg, #0d0d14 0%, #09090b 60%)",
              boxShadow: `0 0 100px ${ACCENT}08 inset`,
            }}
          >
            {/* Corner glow */}
            <div
              className="absolute inset-0 pointer-events-none z-0"
              style={{ background: `radial-gradient(ellipse at 20% 60%, ${ACCENT}09 0%, transparent 55%)` }}
            />

            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] items-center">
              <div className="p-10 md:p-14 relative z-10">
                <SectionLabel>Get started</SectionLabel>
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-4">
                  Intelligence production,<br />start to finish.
                </h2>
                <p className="text-zinc-400 text-base mb-8 leading-relaxed max-w-sm">
                  Open the dashboard, run your first collection, and start building
                  threat intelligence in minutes.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all hover:brightness-110 active:scale-[0.98] cursor-pointer"
                    style={{ background: ACCENT, color: "#09090b", boxShadow: `0 0 28px ${ACCENT}40` }}
                  >
                    Open Dashboard <ArrowRight className="w-4 h-4" weight="bold" />
                  </Link>
                  <a
                    href="#capabilities"
                    className="inline-flex items-center gap-1.5 px-6 py-3 rounded-lg border border-zinc-800 text-zinc-400 text-sm font-medium hover:border-zinc-600 hover:text-zinc-100 transition-colors cursor-pointer"
                  >
                    View capabilities <CaretRight className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Threat radar — right side */}
              <div className="hidden md:flex items-center justify-center overflow-hidden relative z-10" style={{ width: 460, height: 420 }}>
                <ThreatRadar size={390} dark={dark} />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <BrandMark size={16} />
                <span className="font-bold text-sm">
                  <span className="text-zinc-900 dark:text-zinc-100">CTI</span>
                  <span style={{ color: ACCENT }}>Tracker</span>
                </span>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed max-w-[180px]">
                Open-source threat intelligence platform. Built for analysts.
              </p>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-4">Platform</p>
              <ul className="space-y-2.5">
                <li><a href="#capabilities" className="text-xs text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer">Capabilities</a></li>
                <li><a href="#how-it-works" className="text-xs text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer">How it works</a></li>
                <li><Link href="/dashboard" className="text-xs text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer">Dashboard</Link></li>
              </ul>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-4">Sources</p>
              <ul className="space-y-2.5">
                <li><span className="text-xs text-zinc-400">MalwareBazaar</span></li>
                <li><span className="text-xs text-zinc-400">URLhaus</span></li>
                <li><span className="text-xs text-zinc-400">MITRE ATT&amp;CK</span></li>
              </ul>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-4">Reports</p>
              <ul className="space-y-2.5">
                <li><span className="text-xs text-zinc-400">TLP WHITE</span></li>
                <li><span className="text-xs text-zinc-400">TLP GREEN</span></li>
                <li><span className="text-xs text-zinc-400">TLP AMBER</span></li>
                <li><span className="text-xs text-zinc-400">TLP RED</span></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="text-xs text-zinc-500">© 2025 CTI Tracker · GTAC-style threat intelligence platform</span>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              All systems operational
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
