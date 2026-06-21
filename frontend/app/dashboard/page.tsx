"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ListIcon as List,
  XIcon as X,
  ArrowClockwiseIcon as ArrowClockwise,
} from "@phosphor-icons/react";

import Sidebar, { type Tab } from "@/components/Sidebar";
import NavTabs from "@/components/NavTabs";
import LiveFeed from "@/components/LiveFeed";
import CampaignCards from "@/components/CampaignCard";
import RecentIOCsTable from "@/components/RecentIOCsTable";
import ReportsView from "@/components/ReportsView";
import { OverviewTab } from "@/components/dashboard/OverviewTab";
import { HuntTab } from "@/components/dashboard/HuntTab";
import { MitreMatrix } from "@/components/dashboard/MitreMatrix";

import { useSession } from "next-auth/react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useDashboardData } from "@/hooks/useDashboardData";
import { setToken, BASE } from "@/lib/api";

const ACCENT = "#60a5fa";

const VALID_TABS = new Set<Tab>(["overview", "iocs", "campaigns", "reports", "feed", "hunt", "matrix"]);

export default function Dashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [authReady, setAuthReady]     = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const googleAuthedRef               = useRef(false);

  const initialTab = searchParams.get("tab") as Tab;
  const [activeTab, setActiveTab] = useState<Tab>(
    VALID_TABS.has(initialTab) ? initialTab : "overview"
  );

  const {
    stats, iocs, campaigns, reports, watchlistCount,
    loading, refreshing, load, refresh,
  } = useDashboardData();

  // Auth guard — exchange Google OAuth session for a server-signed JWT
  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") { router.replace("/login"); return; }
    if (googleAuthedRef.current) return;
    googleAuthedRef.current = true;

    if (session?.user?.email) {
      fetch(`${BASE}/api/auth/google-signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: session.user.email, name: session.user.name ?? "" }),
      })
        .then((r) => r.json())
        .then((d: { access_token?: string }) => { if (d.access_token) setToken(d.access_token); })
        .catch(() => {})
        .finally(() => setAuthReady(true));
    } else {
      setAuthReady(true);
    }
  }, [status, session, router]);

  useEffect(() => { if (authReady) load(); }, [authReady, load]);

  const { collecting, feedMessages, startCollection } = useWebSocket(load);

  function handleTabChange(tab: Tab) { setActiveTab(tab); setSidebarOpen(false); }

  function handleStartCollection(limit: number) {
    setActiveTab("feed");
    startCollection(limit);
  }

  const counts: Partial<Record<Tab, number>> = {
    iocs:      stats?.total_iocs,
    campaigns: stats?.total_campaigns,
    reports:   stats?.total_reports,
  };

  if (!authReady) return null;

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

          <div className="ml-auto flex items-center gap-2">
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

            <div
              className="hidden sm:flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full"
              style={
                loading
                  ? { color: "#a1a1aa", background: "#27272a40", border: "1px solid #27272a" }
                  : stats
                  ? { color: "#22c55e", background: "#22c55e0d", border: "1px solid #22c55e22" }
                  : { color: "#ef4444", background: "#ef444410", border: "1px solid #ef444425" }
              }
            >
              <motion.span
                animate={loading ? { opacity: [1, 0.3, 1] } : {}}
                transition={{ repeat: Infinity, duration: 1.2 }}
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: loading ? "#a1a1aa" : stats ? "#22c55e" : "#ef4444" }}
              />
              {loading ? "Syncing" : stats ? "API Online" : "API Offline"}
            </div>

            <button
              onClick={refresh}
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
            <OverviewTab stats={stats} collecting={collecting} />
          )}

          {activeTab === "iocs" && (
            <motion.div key="iocs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <RecentIOCsTable iocs={iocs} campaigns={campaigns} onRefresh={load} />
            </motion.div>
          )}

          {activeTab === "campaigns" && (
            <motion.div key="campaigns" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <CampaignCards campaigns={campaigns} onRefresh={load} />
            </motion.div>
          )}

          {activeTab === "reports" && (
            <motion.div key="reports" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <ReportsView reports={reports} onRefresh={load} />
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

          {activeTab === "hunt" && (
            <motion.div key="hunt" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <HuntTab />
            </motion.div>
          )}

          {activeTab === "matrix" && (
            <motion.div key="matrix" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <MitreMatrix />
            </motion.div>
          )}

          <footer className="mt-10 text-center text-zinc-700 text-xs">
            CTI Tracker &nbsp;&middot;&nbsp; MalwareBazaar &middot; URLhaus &middot; FeodoTracker
          </footer>
        </main>
      </div>
    </div>
  );
}
