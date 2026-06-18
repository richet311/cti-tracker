"""
URLhaus collector — abuse.ch's database of malicious URLs.

The REST API now requires an API key. This collector uses the public
CSV download feed which is freely available and updated every few minutes.

CSV column order (no header row):
  0  id
  1  dateadded        timestamp
  2  url
  3  url_status       online / offline
  4  last_online      timestamp
  5  threat           e.g. malware_download, botnet_cc
  6  tags             comma-separated
  7  urlhaus_link
  8  reporter
"""

import csv
import io
import os
import requests
from config import URLHAUS_API

_CSV_ONLINE = "https://urlhaus.abuse.ch/downloads/csv_online/"
_TIMEOUT    = 20


def _parse_csv(text: str) -> list[list[str]]:
    lines = [l for l in text.splitlines() if not l.startswith("#") and l.strip()]
    reader = csv.reader(io.StringIO("\n".join(lines)), quotechar='"')
    return [row for row in reader if len(row) >= 6]


def get_recent_urls(limit: int = 20) -> list[dict]:
    """
    Return currently-online malicious URLs from the public CSV feed.
    Each record has: url, threat, tags (list), date_added, status.
    """
    try:
        r = requests.get(_CSV_ONLINE, timeout=_TIMEOUT)
        r.raise_for_status()
        rows = _parse_csv(r.text)
        result = []
        for row in rows[:limit]:
            tags_raw = row[6].strip() if len(row) > 6 else ""
            tags = [t.strip() for t in tags_raw.split(",") if t.strip()]
            result.append({
                "url":        row[2].strip(),
                "status":     row[3].strip(),
                "threat":     row[5].strip() or None,
                "tags":       tags,
                "date_added": row[1].strip() or None,
            })
        return result
    except requests.RequestException as e:
        print(f"[!] URLhaus error: {e}")
        return []


def lookup_url(url: str) -> dict | None:
    """
    Look up a specific URL. Requires URLHAUS_API_KEY env var (free registration).
    """
    api_key = os.getenv("URLHAUS_API_KEY", "")
    if not api_key:
        print("[!] URL lookup requires URLHAUS_API_KEY env var (free at urlhaus.abuse.ch).")
        return None
    try:
        r = requests.post(
            f"{URLHAUS_API}url/",
            data={"url": url},
            headers={"API-KEY": api_key},
            timeout=_TIMEOUT,
        )
        r.raise_for_status()
        data = r.json()
        return data if data.get("query_status") == "isknown" else None
    except requests.RequestException as e:
        print(f"[!] URLhaus error: {e}")
        return None


def lookup_host(host: str) -> dict | None:
    """
    Look up an IP or domain. Requires URLHAUS_API_KEY env var.
    """
    api_key = os.getenv("URLHAUS_API_KEY", "")
    if not api_key:
        print("[!] Host lookup requires URLHAUS_API_KEY env var (free at urlhaus.abuse.ch).")
        return None
    try:
        r = requests.post(
            f"{URLHAUS_API}host/",
            data={"host": host},
            headers={"API-KEY": api_key},
            timeout=_TIMEOUT,
        )
        r.raise_for_status()
        data = r.json()
        return data if data.get("query_status") == "isknown" else None
    except requests.RequestException as e:
        print(f"[!] URLhaus error: {e}")
        return None
