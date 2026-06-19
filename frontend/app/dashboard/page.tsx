"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  ListIcon as List,
  XIcon as X,
  SunIcon as Sun,
  MoonIcon as Moon,
  ArrowClockwiseIcon as ArrowClockwise,
  PlayIcon as Play,
} from "@phosphor-icons/react";

import Sidebar, { Tab } from "@/components/Sidebar";
import NavTabs from "@/components/NavTabs";
import LiveFeed from "@/components/LiveFeed";
import CampaignCards from "@/components/CampaignCard";
import RecentIOCsTable from "@/components/RecentIOCsTable";
import ReportsView from "@/components/ReportsView";
import { OverviewTab } from "@/components/dashboard/OverviewTab";

import { useTheme } from "@/hooks/useTheme";
import { useWebSocket } from "@/hooks/useWebSocket";
import {
  fetchStats,
  fetchIOCs,
  fetchCampaigns,
  fetchReports,
  fetchWatchlist,
  Stats,
  IOC,
  Campaign,
  Report,
} from "@/lib/api";

const ACCENT = "#60a5fa";

const TAB_TITLES: Record<Tab, string> = {
  overview:  "Overview",
  iocs:      "Indicators of Compromise",
  campaigns: "Tracked Campaigns",
  reports:   "Intelligence Reports",
  feed:      "Live Collection",
};

export default function Dashboard() {
  const [activeTab, setActiveTab]     = useState<Tab>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { dark, mounted, toggleTheme } = useTheme();

  const [stats, setStats]           = useState<Stats | null>(null);
  const [iocs, setIocs]             = useState<IOC[]>([]);
  const [campaigns, setCampaigns]   = useState<Campaign[]>([]);
  const [reports, setReports]       = useState<Report[]>([]);
  const [watchlistCount, setWatchlistCount] = useState(0);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAll = useCallback(async () => {
    try {
      const [s, i, c, r, w] = await Promise.all([
        fetchStats(), fetchIOCs(200), fetchCampaigns(), fetchReports(), fetchWatchlist(),
      ]);
      setStats(s); setIocs(i); setCampaigns(c); setReports(r);
      setWatchlistCount(w.length);
    } catch { /* backend offline */ }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const { collecting, feedMessages, startCollection } = useWebSocket(loadAll);

  function handleRefresh() { setRefreshing(true); loadAll(); }
  function handleTabChange(tab: Tab) { setActiveTab(tab); setSidebarOpen(false); }

  function handleStartCollection() {
    setActiveTab("feed");
    startCollection();
  }

  const counts: Partial<Record<Tab, number>> = {
    iocs:      stats?.total_iocs,
    campaigns: stats?.total_campaigns,
    reports:   stats?.total_reports,
  };

  return (
    <div className="flex min-h-screen">

      <Sidebar
        active={activeTab}
        onChange={handleTabChange}
        counts={counts}
        collecting={collecting}
        watchlistCount={watchlistCount}
      />

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <div className={`fixed inset-y-0 left-0 z-50 md:hidden transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <Sidebar
          active={activeTab}
          onChange={handleTabChange}
          counts={counts}
          collecting={collecting}
          watchlistCount={watchlistCount}
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0">

        <header
          className="sticky top-0 z-30 h-14 flex items-center gap-3 px-5 shrink-0"
          style={{
            background: "rgba(9,9,11,0.92)",
            backdropFilter: "blur(12px)",
            borderBottom: "1px solid #1c1c20",
          }}
        >
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            {sidebarOpen ? <X className="w-4 h-4" weight="bold" /> : <List className="w-4 h-4" weight="bold" />}
          </button>

          <div className="flex items-center gap-1.5 text-sm min-w-0">
            <span className="text-zinc-600 shrink-0">Platform</span>
            <span className="text-zinc-700">/</span>
            <span className="text-zinc-300 font-medium truncate">{TAB_TITLES[activeTab]}</span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {loading && (
              <span className="text-zinc-600 text-xs hidden sm:block">Connecting...</span>
            )}

            {collecting && (
              <motion.div
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ repeat: Infinity, duration: 1.4 }}
                className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ color: ACCENT, background: `${ACCENT}14`, border: `1px solid ${ACCENT}28` }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: ACCENT }} />
                COLLECTING
              </motion.div>
            )}

            <button
              onClick={handleStartCollection}
              disabled={collecting}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[13px] font-semibold transition-all cursor-pointer"
              style={
                collecting
                  ? { background: "#1c1c20", color: "#3f3f46", cursor: "not-allowed" }
                  : { background: ACCENT, color: "#09090b", boxShadow: `0 0 20px ${ACCENT}28` }
              }
            >
              <Play className="w-3.5 h-3.5" weight="bold" />
              <span className="hidden sm:inline">{collecting ? "Running..." : "Run Collection"}</span>
            </button>

            {mounted && (
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors cursor-pointer"
                aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
              >
                {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            )}

            <button
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="p-2 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors disabled:opacity-30 cursor-pointer"
              title="Refresh data"
            >
              <ArrowClockwise className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} weight="bold" />
            </button>
          </div>
        </header>

        <div className="md:hidden" style={{ borderBottom: "1px solid #1c1c20" }}>
          <NavTabs active={activeTab} onChange={handleTabChange} counts={counts} collecting={collecting} />
        </div>

        <main className="flex-1 p-5 max-w-[1400px] w-full mx-auto">

          {activeTab === "overview" && (
            <OverviewTab stats={stats} dark={dark} collecting={collecting} />
          )}

          {activeTab === "iocs" && (
            <motion.div key="iocs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <RecentIOCsTable iocs={iocs} />
            </motion.div>
          )}

          {activeTab === "campaigns" && (
            <motion.div key="campaigns" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <CampaignCards campaigns={campaigns} />
            </motion.div>
          )}

          {activeTab === "reports" && (
            <motion.div key="reports" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <ReportsView reports={reports} />
            </motion.div>
          )}

          {activeTab === "feed" && (
            <motion.div
              key="feed"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="max-w-3xl mx-auto"
            >
              <LiveFeed messages={feedMessages} collecting={collecting} onCollect={handleStartCollection} />
            </motion.div>
          )}

          <footer className="mt-10 text-center text-zinc-700 text-xs">
            CTI Tracker &nbsp;&middot;&nbsp; MalwareBazaar &middot; URLhaus &middot; MITRE ATT&amp;CK
          </footer>
        </main>
      </div>
    </div>
  );
}
