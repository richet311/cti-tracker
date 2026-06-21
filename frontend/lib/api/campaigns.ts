import { BASE } from "./constants";
import { authHeaders } from "./auth";
import type { Campaign, Report, IOC, TTP } from "./types";

export async function fetchCampaigns(): Promise<Campaign[]> {
  const r = await fetch(`${BASE}/api/campaigns`);
  return r.json();
}

export async function fetchReports(): Promise<Report[]> {
  const r = await fetch(`${BASE}/api/reports`);
  return r.json();
}

export async function createCampaign(body: {
  name: string;
  threat_actor?: string;
  motivation?: string;
  status?: string;
  description?: string;
}): Promise<{ id: number; name: string }> {
  const r = await fetch(`${BASE}/api/campaigns`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const d = await r.json().catch(() => ({}));
    throw new Error((d as { detail?: string }).detail ?? "Failed to create campaign");
  }
  return r.json();
}

export async function assignIocToCampaign(campaignId: number, iocId: number): Promise<void> {
  const r = await fetch(`${BASE}/api/campaigns/${campaignId}/iocs`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ ioc_id: iocId }),
  });
  if (!r.ok) {
    const d = await r.json().catch(() => ({}));
    throw new Error((d as { detail?: string }).detail ?? "Failed to assign IOC");
  }
}

export async function deleteCampaign(id: number): Promise<void> {
  const r = await fetch(`${BASE}/api/campaigns/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!r.ok) {
    const d = await r.json().catch(() => ({}));
    throw new Error((d as { detail?: string }).detail ?? "Failed to delete campaign");
  }
}

export async function deleteReport(id: number): Promise<void> {
  const r = await fetch(`${BASE}/api/reports/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!r.ok) {
    const d = await r.json().catch(() => ({}));
    throw new Error((d as { detail?: string }).detail ?? "Failed to delete report");
  }
}

export async function fetchReport(id: number): Promise<Report> {
  const r = await fetch(`${BASE}/api/reports/${id}`, { headers: authHeaders() });
  if (!r.ok) throw new Error("Failed to fetch report");
  return r.json();
}

export async function fetchCampaignIocs(campaignId: number): Promise<IOC[]> {
  const r = await fetch(`${BASE}/api/campaigns/${campaignId}/iocs`, { headers: authHeaders() });
  if (!r.ok) return [];
  return r.json();
}

export async function removeIocFromCampaign(campaignId: number, iocId: number): Promise<void> {
  const r = await fetch(`${BASE}/api/campaigns/${campaignId}/iocs/${iocId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!r.ok) {
    const d = await r.json().catch(() => ({}));
    throw new Error((d as { detail?: string }).detail ?? "Failed to remove IOC");
  }
}

export async function fetchAllTtps(): Promise<TTP[]> {
  const r = await fetch(`${BASE}/api/ttps`, { headers: authHeaders() });
  if (!r.ok) return [];
  return r.json();
}

export async function fetchCampaignTtps(campaignId: number): Promise<TTP[]> {
  const r = await fetch(`${BASE}/api/campaigns/${campaignId}/ttps`, { headers: authHeaders() });
  if (!r.ok) return [];
  return r.json();
}

export async function addTtpToCampaign(
  campaignId: number,
  ttp: { technique_id: string; technique_name: string; tactic: string },
): Promise<void> {
  const r = await fetch(`${BASE}/api/campaigns/${campaignId}/ttps`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(ttp),
  });
  if (!r.ok) throw new Error("Failed to add TTP");
}

export async function removeTtpFromCampaign(campaignId: number, techniqueId: string): Promise<void> {
  const r = await fetch(`${BASE}/api/campaigns/${campaignId}/ttps/${techniqueId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!r.ok) throw new Error("Failed to remove TTP");
}

export async function generateCampaignReport(
  campaignId: number,
  tlp = "TLP:WHITE",
): Promise<{ id: number; title: string }> {
  const r = await fetch(`${BASE}/api/reports/${campaignId}?tlp=${encodeURIComponent(tlp)}`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!r.ok) {
    const d = await r.json().catch(() => ({}));
    throw new Error((d as { detail?: string }).detail ?? "Failed to generate report");
  }
  return r.json();
}
