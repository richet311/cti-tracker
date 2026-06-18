const BASE = "http://localhost:8000";

export interface Stats {
  total_iocs: number;
  total_campaigns: number;
  total_reports: number;
  ioc_types: { ioc_type: string; cnt: number }[];
  top_families: { malware_family: string; cnt: number }[];
}

export interface IOC {
  id: number;
  value: string;
  ioc_type: string;
  malware_family: string | null;
  threat_type: string | null;
  source: string | null;
  first_seen: string | null;
  last_seen: string | null;
  created_at: string;
}

export interface Campaign {
  id: number;
  name: string;
  threat_actor: string | null;
  motivation: string;
  status: string;
  description: string | null;
  ioc_count: number;
  ttp_count: number;
  updated_at: string;
}

export interface Report {
  id: number;
  title: string;
  report_type: string;
  tlp: string;
  created_at: string;
  campaign_name: string | null;
}

export interface FeedMessage {
  id: string;
  type: "ioc" | "status" | "complete";
  source: string;
  message?: string;
  value?: string;
  ioc_type?: string;
  malware_family?: string | null;
  threat_type?: string | null;
  first_seen?: string | null;
  total?: number;
  timestamp: number;
}

export async function fetchStats(): Promise<Stats> {
  const r = await fetch(`${BASE}/api/stats`);
  return r.json();
}

export async function fetchIOCs(limit = 50): Promise<IOC[]> {
  const r = await fetch(`${BASE}/api/iocs?limit=${limit}`);
  return r.json();
}

export async function fetchCampaigns(): Promise<Campaign[]> {
  const r = await fetch(`${BASE}/api/campaigns`);
  return r.json();
}

export async function fetchReports(): Promise<Report[]> {
  const r = await fetch(`${BASE}/api/reports`);
  return r.json();
}

export const WS_COLLECT_URL = "ws://localhost:8000/ws/collect";

export const IOC_TYPE_COLORS: Record<string, string> = {
  hash_sha256: "#00d4ff",
  hash_md5: "#9f7aea",
  hash_sha1: "#60a5fa",
  url: "#ff6b35",
  ip: "#fbbf24",
  domain: "#34d399",
  unknown: "#94a3b8",
};

export const SOURCE_COLORS: Record<string, string> = {
  malwarebazaar: "#00d4ff",
  urlhaus: "#ff6b35",
  manual: "#9f7aea",
  system: "#94a3b8",
};

export function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n) + "…" : s;
}
