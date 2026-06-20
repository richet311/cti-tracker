import { BASE } from "./constants";
import { authHeaders } from "./auth";
import type { WatchlistItem } from "./types";

export async function fetchWatchlist(): Promise<WatchlistItem[]> {
  const r = await fetch(`${BASE}/api/watchlist`);
  if (!r.ok) return [];
  return r.json();
}

export async function addToWatchlist(
  ioc_id: number,
  reason: string,
  priority: "low" | "medium" | "high",
): Promise<void> {
  const r = await fetch(`${BASE}/api/watchlist`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ ioc_id, reason, priority }),
  });
  if (!r.ok) {
    const data = await r.json().catch(() => ({}));
    throw new Error(data.detail ?? "Failed to add to watchlist");
  }
}

export async function removeFromWatchlist(ioc_id: number): Promise<void> {
  await fetch(`${BASE}/api/watchlist/${ioc_id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
}
