"use client";

import { useEffect, useRef } from "react";

interface Props {
  size?: number;
  dark?: boolean;
}

const LABELS = ["APT29", "LAZARUS", "COBALT", "C2", "IOC", "SHA256", "URL", "MD5", "APT28", "FIN7"];

export function ThreatRadar({ size = 400, dark = true }: Props) {
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

    interface Blip { angle: number; dist: number; alpha: number; sz: number; label: string; }

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

      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = isDark ? "rgba(4,8,16,0.94)" : "rgba(238,244,250,0.94)";
      ctx.fill();

      for (let i = 1; i <= 4; i++) {
        ctx.beginPath();
        ctx.arc(cx, cy, R * i / 4, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${ar},${ag},${ab},${isDark ? 0.08 : 0.11})`;
        ctx.lineWidth = 0.6;
        ctx.stroke();
      }

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

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(sweepAngle) * R, cy + Math.sin(sweepAngle) * R);
      ctx.strokeStyle = `rgba(${ar},${ag},${ab},0.85)`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      for (const blip of blips) {
        let diff = sweepAngle - blip.angle;
        while (diff < 0) diff += Math.PI * 2;
        if (diff < 0.07) blip.alpha = 1.0;
        else blip.alpha = Math.max(0, blip.alpha - 0.003);
        if (blip.alpha < 0.02) continue;

        const bx = cx + Math.cos(blip.angle) * blip.dist * R;
        const by = cy + Math.sin(blip.angle) * blip.dist * R;

        const grd = ctx.createRadialGradient(bx, by, 0, bx, by, blip.sz * 5);
        grd.addColorStop(0, `rgba(${ar},${ag},${ab},${(blip.alpha * 0.45).toFixed(3)})`);
        grd.addColorStop(1, `rgba(${ar},${ag},${ab},0)`);
        ctx.beginPath();
        ctx.arc(bx, by, blip.sz * 5, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(bx, by, blip.sz, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${ar},${ag},${ab},${(blip.alpha * 0.95).toFixed(3)})`;
        ctx.fill();

        if (blip.alpha > 0.35) {
          ctx.font = "bold 7.5px monospace";
          ctx.fillStyle = `rgba(${ar},${ag},${ab},${(blip.alpha * 0.65).toFixed(3)})`;
          ctx.fillText(blip.label, bx + blip.sz + 4, by - 1);
        }
      }

      ctx.beginPath();
      ctx.arc(cx, cy, 2.8, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${ar},${ag},${ab},0.8)`;
      ctx.fill();

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
