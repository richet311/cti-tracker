"use client";

import { useEffect, useRef } from "react";

interface Props {
  size?: number;
  dark?: boolean;
}

export function ThreatGlobe({ size = 480, dark = true }: Props) {
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

    const N = 420;
    const golden = Math.PI * (3 - Math.sqrt(5));
    const surface = Array.from({ length: N }, (_, i) => {
      const y = 1 - (i / (N - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const theta = golden * i;
      return { bx: Math.cos(theta) * r, by: y, bz: Math.sin(theta) * r };
    });

    const latAngles = [-0.698, 0, 0.698];
    const latLines = latAngles.map((lat) => {
      const yN = Math.sin(lat), rN = Math.cos(lat);
      return Array.from({ length: 80 }, (_, i) => {
        const t = (i / 80) * Math.PI * 2;
        return { bx: rN * Math.cos(t), by: yN, bz: rN * Math.sin(t) };
      });
    });

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

    const hotspots = Array.from({ length: 20 }, () => {
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

    interface Arc { si: number; di: number; prog: number; speed: number; len: number; }
    const arcs: Arc[] = [];

    function spawnArc() {
      if (arcs.length >= 5) return;
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
      const ar = 0, ag = isDark ? 200 : 100, ab = isDark ? 255 : 180;

      if (frame % 80 === 5 || (arcs.length === 0 && frame % 25 === 0)) spawnArc();

      const ambGrd = ctx.createRadialGradient(cx, cy, R * 0.8, cx, cy, R * 1.55);
      ambGrd.addColorStop(0,   `rgba(${ar},${ag},${ab},0)`);
      ambGrd.addColorStop(0.5, `rgba(${ar},${ag},${ab},${isDark ? 0.04 : 0.03})`);
      ambGrd.addColorStop(1,   `rgba(${ar},${ag},${ab},0)`);
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.55, 0, Math.PI * 2);
      ctx.fillStyle = ambGrd;
      ctx.fill();

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

      ctx.save();
      ctx.setLineDash([]);
      latLines.forEach(pts => drawGridLine(pts, cY, sY, 0.07, isDark));
      lonLines.forEach(pts => drawGridLine(pts, cY, sY, 0.05, isDark));
      ctx.restore();

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
        ctx.lineWidth = 1.4;
        ctx.strokeStyle = isDark
          ? `rgba(0,220,255,${(0.82 * fadeAlpha).toFixed(3)})`
          : `rgba(0,120,200,${(0.78 * fadeAlpha).toFixed(3)})`;
        ctx.stroke();

        if (arc.prog < 1.0) {
          const t = drawProg;
          const dotX = (1-t)*(1-t)*p1.x + 2*(1-t)*t*cpX + t*t*p2.x;
          const dotY = (1-t)*(1-t)*p1.y + 2*(1-t)*t*cpY + t*t*p2.y;
          ctx.setLineDash([]);
          const dotGrd = ctx.createRadialGradient(dotX, dotY, 0, dotX, dotY, 7);
          dotGrd.addColorStop(0, `rgba(${ar},${ag},${ab},0.6)`);
          dotGrd.addColorStop(1, `rgba(${ar},${ag},${ab},0)`);
          ctx.beginPath();
          ctx.arc(dotX, dotY, 7, 0, Math.PI * 2);
          ctx.fillStyle = dotGrd;
          ctx.fill();
          ctx.beginPath();
          ctx.arc(dotX, dotY, 2.4, 0, Math.PI * 2);
          ctx.fillStyle = isDark ? "rgba(0,240,255,1)" : "rgba(0,140,220,1)";
          ctx.fill();
        }
        ctx.restore();
      }

      hotspots.forEach(({ bx, by, bz, pulse, sz }) => {
        const { x, y, z, p: pFactor } = proj(bx, by, bz, cY, sY);
        if (z < -0.35) return;
        const depthT = (z + 1) / 2;
        const sin    = (Math.sin(now * 2.2 + pulse) + 1) / 2;

        ctx.beginPath();
        ctx.arc(x, y, (5 + sin * 6) * pFactor, 0, Math.PI * 2);
        ctx.strokeStyle = isDark
          ? `rgba(0,200,255,${((0.12 + sin * 0.22) * depthT).toFixed(3)})`
          : `rgba(0,100,180,${((0.17 + sin * 0.26) * depthT).toFixed(3)})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();

        const hGrd = ctx.createRadialGradient(x, y, 0, x, y, sz * 4 * pFactor);
        hGrd.addColorStop(0, `rgba(${ar},${ag},${ab},${(0.35 * depthT).toFixed(3)})`);
        hGrd.addColorStop(1, `rgba(${ar},${ag},${ab},0)`);
        ctx.beginPath();
        ctx.arc(x, y, sz * 4 * pFactor, 0, Math.PI * 2);
        ctx.fillStyle = hGrd;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, y, sz * pFactor, 0, Math.PI * 2);
        ctx.fillStyle = isDark
          ? `rgba(0,230,255,${(0.75 + depthT * 0.25).toFixed(3)})`
          : `rgba(0,130,210,${(0.75 + depthT * 0.25).toFixed(3)})`;
        ctx.fill();
      });

      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${ar},${ag},${ab},${isDark ? 0.22 : 0.18})`;
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.save();
      ctx.translate(cx, cy);

      ctx.save();
      ctx.rotate(rotY * 0.38 + 0.6);
      ctx.beginPath();
      ctx.ellipse(0, 0, R * 1.46, R * 0.34, 0, 0, Math.PI * 2);
      ctx.setLineDash([4, 10]);
      ctx.strokeStyle = `rgba(${ar},${ag},${ab},${isDark ? 0.22 : 0.16})`;
      ctx.lineWidth = 0.7;
      ctx.stroke();
      const satAT = now * 0.65;
      const satAx = Math.cos(satAT) * R * 1.46;
      const satAy = Math.sin(satAT) * R * 0.34;
      ctx.setLineDash([]);
      const sgA = ctx.createRadialGradient(satAx, satAy, 0, satAx, satAy, 9);
      sgA.addColorStop(0, `rgba(${ar},${ag},${ab},0.7)`);
      sgA.addColorStop(1, `rgba(${ar},${ag},${ab},0)`);
      ctx.beginPath(); ctx.arc(satAx, satAy, 9, 0, Math.PI * 2);
      ctx.fillStyle = sgA; ctx.fill();
      ctx.beginPath(); ctx.arc(satAx, satAy, 2.2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${ar},${ag},${ab},1)`; ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.rotate(-rotY * 0.24 + 2.1);
      ctx.beginPath();
      ctx.ellipse(0, 0, R * 1.3, R * 0.17, 0, 0, Math.PI * 2);
      ctx.setLineDash([2, 14]);
      ctx.strokeStyle = `rgba(${ar},${ag},${ab},${isDark ? 0.11 : 0.08})`;
      ctx.lineWidth = 0.5;
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      ctx.restore();

      raf = requestAnimationFrame(draw);
    }

    spawnArc();
    draw();
    return () => cancelAnimationFrame(raf);
  }, [size]);

  return <canvas ref={canvasRef} aria-hidden />;
}
