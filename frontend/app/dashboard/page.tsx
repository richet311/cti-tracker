"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Shield, Database, BookOpen, Globe, RefreshCw, Menu, X, Sun, Moon } from "lucide-react";

import Sidebar, { Tab } from "@/components/Sidebar";
import NavTabs from "@/components/NavTabs";
import StatsCard from "@/components/StatsCard";
import IOCChart from "@/components/IOCChart";
import MalwareFamiliesChart from "@/components/MalwareFamiliesChart";
import LiveFeed from "@/components/LiveFeed";
import CampaignCards from "@/components/CampaignCard";
import RecentIOCsTable from "@/components/RecentIOCsTable";
import ReportsView from "@/components/ReportsView";

import {
  fetchStats,
  fetchIOCs,
  fetchCampaigns,
  fetchReports,
  Stats,
  IOC,
  Campaign,
  Report,
  FeedMessage,
  WS_COLLECT_URL,
} from "@/lib/api";

const ACCENT = "#00c8ff";

let msgCounter = 0;

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dark, setDark] = useState(true);
  const [mounted, setMounted] = useState(false);

  const [stats, setStats] = useState<Stats | null>(null);
  const [iocs, setIocs] = useState<IOC[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [collecting, setCollecting] = useState(false);
  const [feedMessages, setFeedMessages] = useState<FeedMessage[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("cti-theme");
    const isDark = saved !== "light";
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("cti-theme", next ? "dark" : "light");
  }

  const loadAll = useCallback(async () => {
    try {
      const [s, i, c, r] = await Promise.all([
        fetchStats(),
        fetchIOCs(200),
        fetchCampaigns(),
        fetchReports(),
      ]);
      setStats(s);
      setIocs(i);
      setCampaigns(c);
      setReports(r);
    } catch {
      // backend not running yet
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  function handleRefresh() {
    setRefreshing(true);
    loadAll();
  }

  function handleTabChange(tab: Tab) {
    setActiveTab(tab);
    setSidebarOpen(false);
  }

  function startCollection() {
    if (collecting || wsRef.current) return;
    setCollecting(true);
    setFeedMessages([]);
    setActiveTab("feed");

    const ws = new WebSocket(WS_COLLECT_URL);
    wsRef.current = ws;

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data) as Omit<FeedMessage, "id" | "timestamp">;
      const full: FeedMessage = {
        ...msg,
        id: String(++msgCounter),
        timestamp: Date.now(),
      };
      setFeedMessages((prev) => [full, ...prev].slice(0, 120));
      if (msg.type === "complete") {
        setCollecting(false);
        wsRef.current = null;
        loadAll();
      }
    };

    ws.onerror = () => {
      setCollecting(false);
      wsRef.current = null;
      setFeedMessages((prev) => [
        {
          id: String(++msgCounter),
          type: "status",
          source: "system",
          message: "WebSocket error: is the backend running on port 8000?",
          timestamp: Date.now(),
        },
        ...prev,
      ]);
    };

    ws.onclose = () => {
      setCollecting(false);
      wsRef.current = null;
    };
  }

  const counts: Partial<Record<Tab, number>> = {
    iocs: stats?.total_iocs,
    campaigns: stats?.total_campaigns,
    reports: stats?.total_reports,
  };

  const TAB_TITLES: Record<Tab, string> = {
    overview: "Overview",
    iocs: "Indicators of Compromise",
    campaigns: "Tracked Campaigns",
    reports: "Intelligence Reports",
    feed: "Live Collection Feed",
  };

  return (
    <div className="flex min-h-screen">
      {/* ── Desktop Sidebar ─────────────────────────────────────────────── */}
      <Sidebar
        active={activeTab}
        onChange={handleTabChange}
        counts={counts}
        collecting={collecting}
      />

      {/* ── Mobile sidebar overlay ──────────────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <div
        className={`fixed inset-y-0 left-0 z-50 md:hidden transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar
          active={activeTab}
          onChange={handleTabChange}
          counts={counts}
          collecting={collecting}
        />
      </div>

      {/* ── Main content ────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center gap-3 px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-[#09090b]/90 backdrop-blur-md">
          {/* Mobile menu toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400"
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-zinc-400 dark:text-zinc-600">Platform</span>
            <span className="text-zinc-300 dark:text-zinc-700">/</span>
            <span className="text-zinc-700 dark:text-zinc-300 font-medium">{TAB_TITLES[activeTab]}</span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {loading && (
              <span className="text-zinc-400 text-xs animate-pulse hidden sm:block">
                Connecting
              </span>
            )}
            {collecting && (
              <motion.span
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ repeat: Infinity, duration: 1.2 }}
                className="text-xs font-semibold hidden sm:block"
                style={{ color: ACCENT }}
              >
                ● COLLECTING
              </motion.span>
            )}
            {mounted && (
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
              >
                {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            )}
            <button
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors disabled:opacity-40"
              title="Refresh all data"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
        </header>

        {/* Mobile tab bar */}
        <div className="md:hidden border-b border-zinc-200 dark:border-zinc-800">
          <NavTabs
            active={activeTab}
            onChange={handleTabChange}
            counts={counts}
            collecting={collecting}
          />
        </div>

        {/* Content */}
        <main className="flex-1 p-6 max-w-[1400px] w-full mx-auto">

          {/* Overview */}
          {activeTab === "overview" && (
            <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                <StatsCard title="Indicators" value={stats?.total_iocs ?? 0} Icon={Database} accentColor={ACCENT} subtitle="IOCs tracked" index={0} />
                <StatsCard title="Campaigns" value={stats?.total_campaigns ?? 0} Icon={Shield} accentColor={ACCENT} subtitle="Adversary clusters" index={1} />
                <StatsCard title="Reports" value={stats?.total_reports ?? 0} Icon={BookOpen} accentColor={ACCENT} subtitle="Intel reports" index={2} />
                <StatsCard title="Sources" value={2} Icon={Globe} accentColor={ACCENT} subtitle="MalwareBazaar · URLhaus" index={3} />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <IOCChart data={stats?.ioc_types ?? []} dark={dark} />
                <MalwareFamiliesChart data={stats?.top_families ?? []} dark={dark} />
              </div>
            </motion.div>
          )}

          {/* IOCs */}
          {activeTab === "iocs" && (
            <motion.div key="iocs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <RecentIOCsTable iocs={iocs} />
            </motion.div>
          )}

          {/* Campaigns */}
          {activeTab === "campaigns" && (
            <motion.div key="campaigns" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <CampaignCards campaigns={campaigns} />
            </motion.div>
          )}

          {/* Reports */}
          {activeTab === "reports" && (
            <motion.div key="reports" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <ReportsView reports={reports} />
            </motion.div>
          )}

          {/* Live Feed */}
          {activeTab === "feed" && (
            <motion.div key="feed" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="max-w-3xl mx-auto">
              <LiveFeed messages={feedMessages} collecting={collecting} onCollect={startCollection} />
            </motion.div>
          )}

          <footer className="mt-10 text-center text-zinc-400 dark:text-zinc-700 text-xs">
            CTI Tracker &nbsp;·&nbsp; MalwareBazaar · URLhaus · MITRE ATT&amp;CK
          </footer>
        </main>
      </div>
    </div>
  );
}
