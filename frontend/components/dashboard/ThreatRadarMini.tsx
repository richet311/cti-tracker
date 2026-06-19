"use client";

import { useEffect, useRef } from "react";

interface Props {
  size?: number;
}

const ACCENT_RGB = "96,165,250";
const LABELS = ["APT29", "LAZARUS", "C2", "IOC", "SHA256", "FIN7", "APT28", "COBALT"];

export function ThreatRadarMini({ size = 220 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

    const cx = size / 2, cy = size / 2, R = size * 0.43;

    const blips = Array.from({ length: 9 }, () => ({
      angle: Math.random() * Math.PI * 2,
      dist:  0.18 + Math.random() * 0.7,
      alpha: Math.random() * 0.2,
      sz:    1.8 + Math.random() * 1.8,
      label: LABELS[Math.floor(Math.random() * LABELS.length)],
    }));

    let sweepAngle = 0, raf: number;

    function draw() {
      ctx.clearRect(0, 0, size, size);
      sweepAngle = (sweepAngle + 0.015) % (Math.PI * 2);

      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(4,6,14,0.96)";
      ctx.fill();

      for (let i = 1; i <= 4; i++) {
        ctx.beginPath();
        ctx.arc(cx, cy, R * i / 4, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${ACCENT_RGB},0.08)`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      ctx.save();
      ctx.setLineDash([2, 5]);
      ctx.strokeStyle = `rgba(${ACCENT_RGB},0.05)`;
      ctx.lineWidth = 0.4;
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
      const TRAIL_STEPS = 24;
      for (let i = 0; i < TRAIL_STEPS; i++) {
        const t  = i / TRAIL_STEPS;
        const a0 = sweepAngle - trailLen * (1 - t);
        const a1 = sweepAngle - trailLen * (1 - t - 1 / TRAIL_STEPS);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, R, a0, a1);
        ctx.closePath();
        ctx.fillStyle = `rgba(${ACCENT_RGB},${(t * t * 0.28).toFixed(3)})`;
        ctx.fill();
      }
      ctx.restore();

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(sweepAngle) * R, cy + Math.sin(sweepAngle) * R);
      ctx.strokeStyle = `rgba(${ACCENT_RGB},0.9)`;
      ctx.lineWidth = 1.2;
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
        grd.addColorStop(0, `rgba(${ACCENT_RGB},${(blip.alpha * 0.5).toFixed(3)})`);
        grd.addColorStop(1, `rgba(${ACCENT_RGB},0)`);
        ctx.beginPath(); ctx.arc(bx, by, blip.sz * 5, 0, Math.PI * 2);
        ctx.fillStyle = grd; ctx.fill();
        ctx.beginPath(); ctx.arc(bx, by, blip.sz, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${ACCENT_RGB},${(blip.alpha * 0.95).toFixed(3)})`; ctx.fill();

        if (blip.alpha > 0.4) {
          ctx.font = "bold 6.5px monospace";
          ctx.fillStyle = `rgba(${ACCENT_RGB},${(blip.alpha * 0.6).toFixed(3)})`;
          ctx.fillText(blip.label, bx + blip.sz + 3, by - 1);
        }
      }

      ctx.beginPath(); ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${ACCENT_RGB},0.9)`; ctx.fill();
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${ACCENT_RGB},0.25)`; ctx.lineWidth = 1; ctx.stroke();

      raf = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(raf);
  }, [size]);

  return <canvas ref={canvasRef} aria-hidden />;
}
