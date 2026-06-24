import Link from "next/link";
import { BrandMark } from "@/components/shared/BrandMark";
import { ACCENT } from "./landing-constants";

export function LandingFooter() {
  return (
    <footer className="py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <BrandMark size={16} color={ACCENT} />
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
              <li><Link href="/dashboard?tab=hunt" className="text-xs text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer">IOC Hunt</Link></li>
              <li><Link href="/watchlist" className="text-xs text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer">Watchlist</Link></li>
              <li><Link href="/login" className="text-xs text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer">Login</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-4">Sources</p>
            <ul className="space-y-2.5">
              <li><span className="text-xs text-zinc-400">MalwareBazaar</span></li>
              <li><span className="text-xs text-zinc-400">URLhaus</span></li>
              <li><span className="text-xs text-zinc-400">FeodoTracker</span></li>
              <li><span className="text-xs text-zinc-400">MITRE ATT&amp;CK</span></li>
            </ul>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-4">Legal</p>
            <ul className="space-y-2.5">
              <li><Link href="/legal/terms" className="text-xs text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer">Terms of Service</Link></li>
              <li><Link href="/legal/privacy" className="text-xs text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer">Privacy Policy</Link></li>
              <li><Link href="/legal/disclaimer" className="text-xs text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer">Disclaimer</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <span className="text-[11px] text-zinc-600 leading-relaxed max-w-lg">
            &copy; 2026 CTI Tracker. Independent portfolio project.{" "}
            Not affiliated with CrowdStrike, MITRE, or abuse.ch.
            IOC data sourced from public feeds and provided for informational purposes only.
          </span>
          <div className="flex items-center gap-4 shrink-0">
            <div className="flex items-center gap-3 text-[11px] text-zinc-600">
              <Link href="/legal/terms" className="hover:text-zinc-400 transition-colors">Terms</Link>
              <span>·</span>
              <Link href="/legal/privacy" className="hover:text-zinc-400 transition-colors">Privacy</Link>
              <span>·</span>
              <Link href="/legal/disclaimer" className="hover:text-zinc-400 transition-colors">Disclaimer</Link>
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              All systems operational
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
