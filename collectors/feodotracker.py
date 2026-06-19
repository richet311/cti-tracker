"""
FeodoTracker collector — abuse.ch's C2 botnet IP tracker.

Tracks confirmed command-and-control servers used by major botnets:
  Dridex, Emotet, QakBot, TrickBot, BazarLoader, IcedID

These are extremely high-confidence indicators — the IPs have been verified
as active C2 infrastructure, not just suspicious activity. This is the kind
of threat feed that GTAC and MDR teams ingest directly into their blocking
and hunting workflows.

No API key required (public threat intelligence).

CSV column order (no header):
  0  first_seen
  1  dst_ip        (the C2 server IP)
  2  dst_port
  3  c2_status     (online / offline)
  4  last_online
  5  malware       (botnet family name)
"""

import csv
import io
import requests

_FEODO_CSV = "https://feodotracker.abuse.ch/downloads/ipblocklist_aggressive.csv"
_TIMEOUT   = 20


def get_c2_ips(limit: int = 50) -> list[dict]:
    """
    Return active C2 botnet IPs from FeodoTracker.

    Each record has: ip, port, malware_family, first_seen, c2_status.
    Confidence is set high by callers (feodotracker = 85) because these
    are verified by abuse.ch, not just heuristically detected.
    """
    try:
        r = requests.get(_FEODO_CSV, timeout=_TIMEOUT)
        r.raise_for_status()
        lines = [l for l in r.text.splitlines() if not l.startswith("#") and l.strip()]
        reader = csv.reader(io.StringIO("\n".join(lines)))
        results: list[dict] = []
        for row in reader:
            if len(row) < 6:
                continue
            family = row[5].strip()
            results.append({
                "first_seen":     row[0].strip(),
                "ip":             row[1].strip(),
                "port":           row[2].strip(),
                "c2_status":      row[3].strip(),
                "last_online":    row[4].strip(),
                "malware_family": family if family else None,
            })
            if len(results) >= limit:
                break
        return results
    except requests.RequestException as e:
        print(f"[!] FeodoTracker error: {e}")
        return []
