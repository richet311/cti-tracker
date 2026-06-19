"""
STIX 2.1 bundle export.

STIX (Structured Threat Information eXpression) is the industry-standard
format for sharing CTI. Every major platform — MISP, OpenCTI, CrowdStrike
Falcon Intelligence, TAXII servers — can import a STIX 2.1 bundle.

This module converts our IOC list into a valid STIX 2.1 Bundle of Indicator
objects. Each indicator uses the official STIX pattern language:

  SHA-256  →  [file:hashes.'SHA-256' = 'abc123...']
  IP       →  [ipv4-addr:value = '1.2.3.4']
  Domain   →  [domain-name:value = 'evil.example.com']
  URL      →  [url:value = 'https://evil.example.com/payload']

The bundle also includes an Identity object representing this platform,
which is required by the STIX 2.1 spec for provenance tracking.

Reference: https://docs.oasis-open.org/cti/stix/v2.1/stix-v2.1.html
"""

import uuid
from datetime import datetime, timezone


def _ts() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


_PATTERNS: dict[str, str] = {
    "hash_sha256": "file:hashes.'SHA-256'",
    "hash_md5":    "file:hashes.MD5",
    "hash_sha1":   "file:hashes.'SHA-1'",
    "ip":          "ipv4-addr:value",
    "domain":      "domain-name:value",
    "url":         "url:value",
}

_SEVERITY_TO_CONFIDENCE: dict[str, int] = {
    "critical": 95,
    "high":     80,
    "medium":   60,
    "low":      35,
}


def build_stix_bundle(iocs: list[dict]) -> dict:
    """
    Convert a list of IOC dicts to a STIX 2.1 Bundle.

    Skips IOCs whose type has no STIX pattern mapping (e.g. unknown).
    Returns a dict that serialises directly to valid STIX 2.1 JSON.
    """
    now = _ts()
    identity_id = f"identity--{uuid.uuid4()}"

    stix_objects: list[dict] = [
        {
            "type":           "identity",
            "spec_version":   "2.1",
            "id":             identity_id,
            "name":           "CTI Tracker",
            "description":    "Automated CTI collection and analysis platform",
            "identity_class": "system",
            "created":        now,
            "modified":       now,
        }
    ]

    for ioc in iocs:
        ioc_type = ioc.get("ioc_type", "")
        prop = _PATTERNS.get(ioc_type)
        if not prop:
            continue

        value = (ioc.get("value") or "").strip()
        if not value:
            continue

        severity   = ioc.get("severity", "medium")
        confidence = _SEVERITY_TO_CONFIDENCE.get(severity, 60)

        labels = ["malicious-activity"]
        if ioc.get("malware_family"):
            labels.append(ioc["malware_family"].lower().replace(" ", "-"))

        description_parts = [f"Source: {ioc.get('source', 'unknown')}."]
        if ioc.get("malware_family"):
            description_parts.append(f"Malware family: {ioc['malware_family']}.")
        if ioc.get("threat_type"):
            description_parts.append(f"Threat type: {ioc['threat_type']}.")
        if ioc.get("confidence"):
            description_parts.append(f"Analyst confidence: {ioc['confidence']}/100.")

        indicator: dict = {
            "type":             "indicator",
            "spec_version":     "2.1",
            "id":               f"indicator--{uuid.uuid4()}",
            "created_by_ref":   identity_id,
            "name":             value[:200],
            "description":      " ".join(description_parts),
            "indicator_types":  ["malicious-activity"],
            "pattern":          f"[{prop} = '{value}']",
            "pattern_type":     "stix",
            "valid_from":       ioc.get("first_seen") or now,
            "created":          ioc.get("created_at") or now,
            "modified":         ioc.get("last_seen") or ioc.get("created_at") or now,
            "confidence":       confidence,
            "labels":           labels,
        }

        stix_objects.append(indicator)

    return {
        "type":         "bundle",
        "id":           f"bundle--{uuid.uuid4()}",
        "spec_version": "2.1",
        "objects":      stix_objects,
    }
