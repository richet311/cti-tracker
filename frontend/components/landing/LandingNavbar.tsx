"use client";

import Link from "next/link";
import {
  SunIcon as Sun,
  MoonIcon as Moon,
  ArrowRightIcon as ArrowRight,
} from "@phosphor-icons/react";
import { BrandMark } from "@/components/shared/BrandMark";
import { ACCENT } from "./landing-constants";

interface Props {
  dark: boolean;
  mounted: boolean;
  scrolled: boolean;
  onToggleTheme: () => void;
}

export function LandingNavbar({ dark, mounted, scrolled, onToggleTheme }: Props) {
  return (
    <nav
      className={`fixed top-0 inset-x-0 z-50 h-14 flex items-center justify-between px-6 sm:px-10 transition-all duration-300 ${
        scrolled
          ? "border-b border-zinc-200/80 dark:border-zinc-900 bg-[#d5d9e8]/90 dark:bg-[#09090b]/90 backdrop-blur-xl"
          : "border-b border-transparent"
      }`}
    >
      <div className="flex items-center gap-2">
        <BrandMark size={20} color={ACCENT} />
        <span className="font-bold tracking-tight text-sm">
          <span className="text-zinc-900 dark:text-zinc-100">CTI</span>
          <span style={{ color: ACCENT }}>Tracker</span>
        </span>
      </div>

      <div className="hidden sm:flex items-center gap-7 text-sm text-zinc-500 dark:text-zinc-400">
        <a href="#capabilities" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer">
          Capabilities
        </a>
        <a href="#how-it-works" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer">
          How it works
        </a>
        <a href="#sources" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer">
          Sources
        </a>
        <Link href="/hunt" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer">
          IOC Hunt
        </Link>
      </div>

      <div className="flex items-center gap-2">
        {mounted && (
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-md text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        )}
        <Link
          href="/login"
          className="px-3 py-1.5 rounded-md text-sm font-medium border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
        >
          Login
        </Link>
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-semibold transition-all hover:brightness-110 cursor-pointer"
          style={{ background: ACCENT, color: "#09090b" }}
        >
          Dashboard <ArrowRight className="w-3.5 h-3.5" weight="bold" />
        </Link>
      </div>
    </nav>
  );
}
