"""
IOC confidence scoring and severity classification.

Confidence (0–100) answers: "How certain are we this is malicious?"
Severity (low/medium/high/critical) answers: "How dangerous is it if true?"

Both fields appear in every production CTI platform — MISP calls them
"confidence" and "threat_level_id", OpenCTI uses the same terms, and
CrowdStrike Falcon Intelligence assigns a malicious confidence score to
each indicator. This module is a simplified but structurally faithful
version of that logic.
"""

_SOURCE_BASE: dict[str, int] = {
    "feodotracker":  85,  # verified C2 IPs, manually vetted by abuse.ch
    "malwarebazaar": 75,  # confirmed malware samples
    "urlhaus":       70,  # reported malicious URLs, some false positives
    "manual":        55,  # analyst-submitted, not yet verified
    "system":        40,
}


def score_confidence(
    source: str,
    malware_family: str | None,
    tags: list[str],
    source_count: int = 1,
) -> int:
    """
    Compute an initial confidence score for a newly ingested IOC.

    Boosts:
      +15 if a known malware family is attributed
      +5  if additional metadata tags are present
      +5  for each additional source that corroborates it (capped at +15)
    """
    base = _SOURCE_BASE.get(source, 50)
    if malware_family:
        base += 15
    if tags:
        base += 5
    if source_count > 1:
        base += min((source_count - 1) * 5, 15)
    return min(base, 95)


def classify_severity(
    ioc_type: str,
    source: str,
    malware_family: str | None,
    threat_type: str | None,
    confidence: int,
) -> str:
    """
    Assign a severity level based on IOC type, source, and enrichment data.

    Severity is independent of confidence — a low-confidence C2 IP is still
    critical if confirmed; a high-confidence URL hash might only be high.
    """
    if ioc_type == "ip" and source == "feodotracker":
        return "critical"

    if ioc_type == "ip":
        return "high" if threat_type else "medium"

    if ioc_type in ("hash_sha256", "hash_md5", "hash_sha1"):
        if malware_family:
            return "high"
        return "medium"

    if ioc_type in ("url", "domain"):
        if malware_family or threat_type:
            return "high"
        return "medium"

    return "low"
