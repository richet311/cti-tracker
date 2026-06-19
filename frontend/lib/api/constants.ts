export const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const wsBase = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/^https?/, "ws");
export const WS_COLLECT_URL = `${wsBase}/ws/collect`;

export const IOC_TYPE_COLORS: Record<string, string> = {
  hash_sha256: "#00d4ff",
  hash_md5:    "#9f7aea",
  hash_sha1:   "#60a5fa",
  url:         "#ff6b35",
  ip:          "#fbbf24",
  domain:      "#34d399",
  unknown:     "#94a3b8",
};

export const SEVERITY_COLORS: Record<string, string> = {
  critical: "#ef4444",
  high:     "#f97316",
  medium:   "#fbbf24",
  low:      "#94a3b8",
};

export const SOURCE_COLORS: Record<string, string> = {
  malwarebazaar: "#00d4ff",
  urlhaus:       "#ff6b35",
  feodotracker:  "#ef4444",
  manual:        "#9f7aea",
  system:        "#94a3b8",
};
