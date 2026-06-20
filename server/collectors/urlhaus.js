const CSV_ONLINE = "https://urlhaus.abuse.ch/downloads/csv_online/";
const API_URL    = "https://urlhaus-api.abuse.ch/v1/";
const TIMEOUT    = 20_000;

function parseCSV(text) {
  return text
    .split("\n")
    .filter((l) => l.trim() && !l.startsWith("#"))
    .map((line) => line.split(",").map((f) => f.trim().replace(/^"|"$/g, "")))
    .filter((row) => row.length >= 6);
}

async function getRecentUrls(limit = 20) {
  try {
    const res = await fetch(CSV_ONLINE, { signal: AbortSignal.timeout(TIMEOUT) });
    if (!res.ok) return [];
    const text = await res.text();
    const rows = parseCSV(text).slice(0, limit);
    return rows.map((row) => {
      const tagsRaw = row[6] || "";
      const tags = tagsRaw.split(",").map((t) => t.trim()).filter(Boolean);
      return {
        url:        row[2] || "",
        status:     row[3] || "",
        threat:     row[5] || null,
        tags,
        date_added: row[1] || null,
      };
    });
  } catch (e) {
    console.error("[!] URLhaus error:", e.message);
    return [];
  }
}

async function lookupUrl(url) {
  const apiKey = process.env.URLHAUS_API_KEY || "";
  if (!apiKey) return null;
  try {
    const body = new URLSearchParams({ url });
    const res = await fetch(`${API_URL}url/`, {
      method: "POST",
      body,
      headers: { "API-KEY": apiKey },
      signal: AbortSignal.timeout(TIMEOUT),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.query_status === "isknown" ? data : null;
  } catch (e) {
    console.error("[!] URLhaus lookup error:", e.message);
    return null;
  }
}

async function lookupHost(host) {
  const apiKey = process.env.URLHAUS_API_KEY || "";
  if (!apiKey) return null;
  try {
    const body = new URLSearchParams({ host });
    const res = await fetch(`${API_URL}host/`, {
      method: "POST",
      body,
      headers: { "API-KEY": apiKey },
      signal: AbortSignal.timeout(TIMEOUT),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.query_status === "isknown" ? data : null;
  } catch (e) {
    console.error("[!] URLhaus host lookup error:", e.message);
    return null;
  }
}

module.exports = { getRecentUrls, lookupUrl, lookupHost };
