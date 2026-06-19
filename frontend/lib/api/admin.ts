import { BASE } from "./constants";
import { authHeaders } from "./auth";
import type { AuditEntry } from "./types";

export async function fetchAuditLog(limit = 100): Promise<AuditEntry[]> {
  const r = await fetch(`${BASE}/api/audit?limit=${limit}`, {
    headers: authHeaders(),
  });
  return r.json();
}
