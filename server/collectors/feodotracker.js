const FEODO_CSV = "https://feodotracker.abuse.ch/downloads/ipblocklist_aggressive.csv";
const TIMEOUT   = 20_000;

async function getC2Ips(limit = 50) {
  try {
    const res = await fetch(FEODO_CSV, { signal: AbortSignal.timeout(TIMEOUT) });
    if (!res.ok) return [];
    const text = await res.text();
    const lines = text.split("\n").filter((l) => l.trim() && !l.startsWith("#"));
    const results = [];
    for (const line of lines) {
      const row = line.split(",").map((f) => f.trim());
      if (row.length < 6) continue;
      const family = row[5] || "";
      results.push({
        first_seen:     row[0] || null,
        ip:             row[1] || "",
        port:           row[2] || "",
        c2_status:      row[3] || "",
        last_online:    row[4] || null,
        malware_family: family || null,
      });
      if (results.length >= limit) break;
    }
    return results;
  } catch (e) {
    console.error("[!] FeodoTracker error:", e.message);
    return [];
  }
}

module.exports = { getC2Ips };
