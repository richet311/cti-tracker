"use client";

import { useState, useCallback } from "react";
import {
  fetchStats,
  fetchIOCs,
  fetchCampaigns,
  fetchReports,
  fetchWatchlist,
} from "@/lib/api";
import type { Stats, IOC, Campaign, Report } from "@/lib/api";

export function useDashboardData() {
  const [stats, setStats]                   = useState<Stats | null>(null);
  const [iocs, setIocs]                     = useState<IOC[]>([]);
  const [campaigns, setCampaigns]           = useState<Campaign[]>([]);
  const [reports, setReports]               = useState<Report[]>([]);
  const [watchlistCount, setWatchlistCount] = useState(0);
  const [loading, setLoading]               = useState(true);
  const [refreshing, setRefreshing]         = useState(false);
  const [refreshedAt, setRefreshedAt]       = useState<Date | null>(null);

  const load = useCallback(async () => {
    const start = Date.now();
    try {
      const [s, i, c, r, w] = await Promise.all([
        fetchStats(), fetchIOCs(200), fetchCampaigns(), fetchReports(), fetchWatchlist(),
      ]);
      setStats(s);
      setIocs(i);
      setCampaigns(c);
      setReports(r);
      setWatchlistCount(w.length);
      setRefreshedAt(new Date());
    } catch { /* backend offline */ }
    finally {
      const elapsed = Date.now() - start;
      if (elapsed < 600) await new Promise((r) => setTimeout(r, 600 - elapsed));
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  function refresh() {
    setRefreshing(true);
    load();
  }

  return { stats, iocs, campaigns, reports, watchlistCount, loading, refreshing, refreshedAt, load, refresh };
}
