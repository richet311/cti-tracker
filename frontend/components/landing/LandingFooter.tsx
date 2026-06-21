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
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-4">Reports</p>
            <ul className="space-y-2.5">
              <li><span className="text-xs text-zinc-400">TLP WHITE</span></li>
              <li><span className="text-xs text-zinc-400">TLP GREEN</span></li>
              <li><span className="text-xs text-zinc-400">TLP AMBER</span></li>
              <li><span className="text-xs text-zinc-400">TLP RED</span></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6 mb-5">
          <p className="text-[10px] text-zinc-500 leading-relaxed max-w-3xl">
            <span className="font-semibold text-zinc-400">Data notice:</span> This platform stores account information (name and email address), user-generated content (campaigns, watchlist entries, and reports), and IOC metadata sourced from public threat intelligence feeds (MalwareBazaar, URLhaus, FeodoTracker, and MITRE ATT&amp;CK) in a database. IOC data originates entirely from public sources and contains no personal information. No usage analytics, third-party trackers, or advertising cookies are used. By creating an account you consent to storage of the above data for the purpose of operating the platform.
          </p>
        </div>

        <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="text-xs text-zinc-500">
            &copy; 2026 CTI Tracker. GTAC-style threat intelligence platform.
          </span>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            All systems operational
          </div>
        </div>
      </div>
    </footer>
  );
}
