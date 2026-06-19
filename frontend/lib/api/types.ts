export interface Stats {
  total_iocs: number;
  total_campaigns: number;
  total_reports: number;
  total_watchlist: number;
  ioc_types: { ioc_type: string; cnt: number }[];
  top_families: { malware_family: string; cnt: number }[];
  severity_counts: { severity: string; cnt: number }[];
  source_counts: { source: string; cnt: number }[];
}

export interface IOC {
  id: number;
  value: string;
  ioc_type: string;
  malware_family: string | null;
  threat_type: string | null;
  confidence: number;
  severity: string;
  source: string | null;
  source_count: number;
  first_seen: string | null;
  last_seen: string | null;
  created_at: string;
}

export interface WatchlistItem {
  id: number;
  ioc_id: number;
  added_by: string;
  reason: string | null;
  priority: "low" | "medium" | "high";
  added_at: string;
  value: string;
  ioc_type: string;
  malware_family: string | null;
  severity: string;
  confidence: number;
  source: string | null;
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

export interface AuditEntry {
  id: number;
  actor: string;
  action: string;
  target_type: string | null;
  target_id: number | null;
  details: string | null;
  created_at: string;
}
