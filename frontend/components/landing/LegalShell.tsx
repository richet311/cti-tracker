"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { LandingNavbar } from "./LandingNavbar";
import { LandingFooter } from "./LandingFooter";

interface Props {
  title: string;
  subtitle: string;
  updated: string;
  children: React.ReactNode;
}

export function LegalShell({ title, subtitle, updated, children }: Props) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100">
      <LandingNavbar scrolled={scrolled} />
      <main className="pt-24 pb-24 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-1.5 text-xs text-zinc-600 mb-10">
            <Link href="/" className="hover:text-zinc-400 transition-colors">Home</Link>
            <span>›</span>
            <span className="text-zinc-500">{title}</span>
          </div>

          <div className="mb-10 pb-8 border-b border-zinc-800">
            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-3">Legal</p>
            <h1 className="text-3xl font-black tracking-tight text-white mb-3">{title}</h1>
            <p className="text-zinc-400 text-sm leading-relaxed">{subtitle}</p>
            <p className="text-zinc-600 text-xs mt-3">Last updated: {updated}</p>
          </div>

          <div className="space-y-8">{children}</div>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
