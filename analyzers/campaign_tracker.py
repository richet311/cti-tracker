"""
Campaign tracker / clustering logic.

In production CTI platforms (Maltego, OpenCTI, MISP) campaign clustering
uses graph-based pivot analysis: shared infrastructure (IP → domain → cert
→ registrant email) and behavioral similarity (same packer, same C2 beacon
interval, same exploit kit).

Here we use two lightweight heuristics as proxies:
  1. Shared malware family — two IOCs using the same malware family are
     likely part of the same campaign.
  2. Manual association — analysts can explicitly link IOCs to campaigns.
"""

import database.operations as db


def suggest_campaign(
    ioc_value: str,
    malware_family: str | None = None,
    tags: list[str] | None = None,
) -> list[tuple[int, str, str]]:
    """
    Given enriched IOC data, suggest existing campaigns this IOC could
    belong to.

    Returns a list of (campaign_id, campaign_name, reason) tuples.
    """
    suggestions = []

    if not malware_family:
        return suggestions

    for campaign in db.list_campaigns():
        cid = campaign["id"]
        for cioc in db.get_campaign_iocs(cid):
            if cioc.get("malware_family") == malware_family:
                suggestions.append((
                    cid,
                    campaign["name"],
                    f"Shared malware family: {malware_family}",
                ))
                break

    return suggestions


def get_campaign_summary(campaign_id: int) -> dict | None:
    """
    Assemble all data for a campaign into one structured dict.
    Used by the report generator to avoid multiple DB calls.
    """
    campaign = db.get_campaign(campaign_id)
    if not campaign:
        return None

    iocs = db.get_campaign_iocs(campaign_id)
    ttps = db.get_campaign_ttps(campaign_id)

    ioc_by_type: dict[str, list[str]] = {}
    families: set[str] = set()
    for ioc in iocs:
        ioc_by_type.setdefault(ioc["ioc_type"], []).append(ioc["value"])
        if ioc.get("malware_family"):
            families.add(ioc["malware_family"])

    tactic_groups: dict[str, list[dict]] = {}
    for ttp in ttps:
        tactic_groups.setdefault(ttp.get("tactic", "unknown"), []).append(ttp)

    return {
        "campaign":         campaign,
        "total_iocs":       len(iocs),
        "ioc_by_type":      ioc_by_type,
        "malware_families": sorted(families),
        "ttps":             ttps,
        "tactic_groups":    tactic_groups,
    }
