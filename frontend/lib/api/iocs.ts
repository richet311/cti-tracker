import { BASE } from "./constants";
import type { Stats, IOC } from "./types";

export async function fetchStats(): Promise<Stats> {
  const r = await fetch(`${BASE}/api/stats`);
  return r.json();
}

export async function fetchIOCs(limit = 50): Promise<IOC[]> {
  const r = await fetch(`${BASE}/api/iocs?limit=${limit}`);
  return r.json();
}

export async function searchIOCs(params: {
  q?: string;
  ioc_type?: string;
  severity?: string;
  source?: string;
  malware_family?: string;
  min_confidence?: number;
  limit?: number;
}): Promise<IOC[]> {
  const qs = new URLSearchParams();
  if (params.q) qs.set("q", params.q);
  if (params.ioc_type) qs.set("ioc_type", params.ioc_type);
  if (params.severity) qs.set("severity", params.severity);
  if (params.source) qs.set("source", params.source);
  if (params.malware_family) qs.set("malware_family", params.malware_family);
  if (params.min_confidence) qs.set("min_confidence", String(params.min_confidence));
  qs.set("limit", String(params.limit ?? 200));
  const r = await fetch(`${BASE}/api/iocs/search?${qs}`);
  return r.json();
}
