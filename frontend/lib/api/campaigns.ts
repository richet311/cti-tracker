import { BASE } from "./constants";
import type { Campaign, Report } from "./types";

export async function fetchCampaigns(): Promise<Campaign[]> {
  const r = await fetch(`${BASE}/api/campaigns`);
  return r.json();
}

export async function fetchReports(): Promise<Report[]> {
  const r = await fetch(`${BASE}/api/reports`);
  return r.json();
}
