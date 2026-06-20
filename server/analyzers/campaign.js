const db = require("../db");

function getCampaignSummary(campaignId) {
  const campaign = db.getCampaign(campaignId);
  if (!campaign) return null;

  const iocs = db.getCampaignIocs(campaignId);
  const ttps = db.getCampaignTtps(campaignId);

  const iocByType = {};
  const families = new Set();
  for (const ioc of iocs) {
    if (!iocByType[ioc.ioc_type]) iocByType[ioc.ioc_type] = [];
    iocByType[ioc.ioc_type].push(ioc.value);
    if (ioc.malware_family) families.add(ioc.malware_family);
  }

  const tacticGroups = {};
  for (const ttp of ttps) {
    const tactic = ttp.tactic || "unknown";
    if (!tacticGroups[tactic]) tacticGroups[tactic] = [];
    tacticGroups[tactic].push(ttp);
  }

  return {
    campaign,
    total_iocs:       iocs.length,
    ioc_by_type:      iocByType,
    malware_families: [...families].sort(),
    ttps,
    tactic_groups:    tacticGroups,
  };
}

module.exports = { getCampaignSummary };
