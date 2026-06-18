"""
IOC Analyzer.

Determines what kind of indicator a string is, then queries the
appropriate intelligence sources to enrich it.

IOC Types recognised
--------------------
hash_md5    32 hex chars
hash_sha1   40 hex chars
hash_sha256 64 hex chars
ip          IPv4 dotted-decimal
url         starts with http:// or https://
domain      anything else that looks like a hostname
unknown     cannot classify
"""

import re
from collectors import malwarebazaar, urlhaus

_RE_MD5    = re.compile(r"^[a-fA-F0-9]{32}$")
_RE_SHA1   = re.compile(r"^[a-fA-F0-9]{40}$")
_RE_SHA256 = re.compile(r"^[a-fA-F0-9]{64}$")
_RE_IP     = re.compile(r"^\d{1,3}(\.\d{1,3}){3}$")
_RE_URL    = re.compile(r"^https?://", re.IGNORECASE)
_RE_DOMAIN = re.compile(
    r"^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$"
)


def detect_ioc_type(value: str) -> str:
    v = value.strip()
    if _RE_MD5.match(v):    return "hash_md5"
    if _RE_SHA1.match(v):   return "hash_sha1"
    if _RE_SHA256.match(v): return "hash_sha256"
    if _RE_IP.match(v):     return "ip"
    if _RE_URL.match(v):    return "url"
    if _RE_DOMAIN.match(v): return "domain"
    return "unknown"


def analyze_ioc(value: str) -> dict:
    """
    Enrich a single IOC by querying relevant threat intel sources.

    Returns a normalised dict regardless of IOC type so callers never
    have to branch on type themselves.
    """
    ioc_type = detect_ioc_type(value)
    result = {
        "value":          value,
        "type":           ioc_type,
        "sources":        [],
        "malware_family": None,
        "threat_type":    None,
        "tags":           [],
        "first_seen":     None,
        "last_seen":      None,
        "raw":            {},
    }

    if ioc_type in ("hash_md5", "hash_sha1", "hash_sha256"):
        data = malwarebazaar.lookup_hash(value)
        if data:
            result["sources"].append("MalwareBazaar")
            result["malware_family"] = data.get("signature")
            result["tags"]           = data.get("tags") or []
            result["threat_type"]    = result["tags"][0] if result["tags"] else None
            result["first_seen"]     = data.get("first_seen")
            result["last_seen"]      = data.get("last_seen")
            result["raw"]["malwarebazaar"] = data

    elif ioc_type in ("ip", "domain"):
        data = urlhaus.lookup_host(value)
        if data:
            result["sources"].append("URLhaus")
            urls = data.get("urls") or []
            if urls:
                result["threat_type"] = urls[0].get("threat")
                result["tags"] = list({
                    tag
                    for u in urls
                    for tag in (u.get("tags") or [])
                })
            result["first_seen"] = data.get("first_seen")
            result["last_seen"]  = data.get("last_seen")
            result["raw"]["urlhaus"] = data

    elif ioc_type == "url":
        data = urlhaus.lookup_url(value)
        if data:
            result["sources"].append("URLhaus")
            result["threat_type"] = data.get("threat")
            result["tags"]        = data.get("tags") or []
            result["first_seen"]  = data.get("date_added")
            result["raw"]["urlhaus"] = data

    return result
