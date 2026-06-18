"""
MITRE ATT&CK collector.

Downloads the Enterprise ATT&CK STIX bundle once and caches it locally.
STIX (Structured Threat Information eXpression) is the industry standard
format for sharing CTI — ATT&CK is distributed as a STIX 2.0 bundle.

Each ATT&CK technique is a STIX 'attack-pattern' object. We parse out:
  - Technique ID  (e.g. T1059.001)
  - Name
  - Tactic(s)     (from kill_chain_phases)
  - Platforms     (Windows, Linux, macOS, etc.)
  - Description   (truncated for display)
"""

import json
import os
import requests
from config import MITRE_ATTACK_STIX, DATA_DIR

_CACHE = os.path.join(DATA_DIR, "mitre_attack_cache.json")
_TIMEOUT = 60


def _load_stix() -> dict | None:
    if os.path.exists(_CACHE):
        with open(_CACHE, "r", encoding="utf-8") as f:
            return json.load(f)

    print("[*] Downloading MITRE ATT&CK data (first run, ~15 MB) ...")
    try:
        r = requests.get(MITRE_ATTACK_STIX, timeout=_TIMEOUT)
        r.raise_for_status()
        data = r.json()
        with open(_CACHE, "w", encoding="utf-8") as f:
            json.dump(data, f)
        print("[+] ATT&CK data cached to disk.")
        return data
    except requests.RequestException as e:
        print(f"[!] Failed to download ATT&CK data: {e}")
        return None


def get_techniques() -> list[dict]:
    """Return all non-revoked ATT&CK Enterprise techniques as plain dicts."""
    data = _load_stix()
    if not data:
        return []

    techniques = []
    for obj in data.get("objects", []):
        if obj.get("type") != "attack-pattern":
            continue
        if obj.get("revoked") or obj.get("x_mitre_deprecated"):
            continue

        technique_id = ""
        for ref in obj.get("external_references", []):
            if ref.get("source_name") == "mitre-attack":
                technique_id = ref.get("external_id", "")
                break

        tactics = [
            phase["phase_name"]
            for phase in obj.get("kill_chain_phases", [])
        ]

        techniques.append({
            "id":          technique_id,
            "name":        obj.get("name", ""),
            "description": obj.get("description", "")[:400],
            "tactic":      ", ".join(tactics),
            "platforms":   ", ".join(obj.get("x_mitre_platforms", [])),
        })

    return sorted(techniques, key=lambda t: t["id"])


def search_techniques(keyword: str) -> list[dict]:
    """Full-text search across technique names and descriptions."""
    kw = keyword.lower()
    return [
        t for t in get_techniques()
        if kw in t["name"].lower() or kw in t["description"].lower()
    ]


def get_technique_by_id(technique_id: str) -> dict | None:
    """Look up a technique by its ATT&CK ID (exact or prefix match)."""
    uid = technique_id.upper()
    for t in get_techniques():
        if t["id"] == uid or t["id"].startswith(uid):
            return t
    return None
