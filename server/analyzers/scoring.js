const SOURCE_BASE = {
  feodotracker:  85,
  malwarebazaar: 75,
  urlhaus:       70,
  manual:        55,
  system:        40,
};

function scoreConfidence(source, malwareFamily, tags = [], sourceCount = 1) {
  let base = SOURCE_BASE[source] ?? 50;
  if (malwareFamily) base += 15;
  if (tags.length)   base += 5;
  if (sourceCount > 1) base += Math.min((sourceCount - 1) * 5, 15);
  return Math.min(base, 95);
}

function classifySeverity(iocType, source, malwareFamily, threatType, confidence) {
  if (iocType === "ip" && source === "feodotracker") return "critical";
  if (iocType === "ip") return threatType ? "high" : "medium";
  if (["hash_sha256", "hash_md5", "hash_sha1"].includes(iocType)) {
    return malwareFamily ? "high" : "medium";
  }
  if (["url", "domain"].includes(iocType)) {
    return malwareFamily || threatType ? "high" : "medium";
  }
  return "low";
}

module.exports = { scoreConfidence, classifySeverity };
