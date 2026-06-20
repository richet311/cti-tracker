const { randomUUID } = require("crypto");

const PATTERNS = {
  hash_sha256: "file:hashes.'SHA-256'",
  hash_md5:    "file:hashes.MD5",
  hash_sha1:   "file:hashes.'SHA-1'",
  ip:          "ipv4-addr:value",
  domain:      "domain-name:value",
  url:         "url:value",
};

const SEVERITY_CONFIDENCE = { critical: 95, high: 80, medium: 60, low: 35 };

function buildStixBundle(iocs) {
  const now = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  const identityId = `identity--${randomUUID()}`;

  const objects = [
    {
      type: "identity", spec_version: "2.1", id: identityId,
      name: "CTI Tracker",
      description: "Automated CTI collection and analysis platform",
      identity_class: "system", created: now, modified: now,
    },
  ];

  for (const ioc of iocs) {
    const prop = PATTERNS[ioc.ioc_type];
    if (!prop || !ioc.value?.trim()) continue;

    const confidence = SEVERITY_CONFIDENCE[ioc.severity] ?? 60;
    const labels = ["malicious-activity"];
    if (ioc.malware_family) labels.push(ioc.malware_family.toLowerCase().replace(/ /g, "-"));

    const descParts = [`Source: ${ioc.source || "unknown"}.`];
    if (ioc.malware_family) descParts.push(`Malware family: ${ioc.malware_family}.`);
    if (ioc.threat_type)    descParts.push(`Threat type: ${ioc.threat_type}.`);
    if (ioc.confidence)     descParts.push(`Analyst confidence: ${ioc.confidence}/100.`);

    objects.push({
      type: "indicator", spec_version: "2.1",
      id: `indicator--${randomUUID()}`,
      created_by_ref: identityId,
      name: ioc.value.slice(0, 200),
      description: descParts.join(" "),
      indicator_types: ["malicious-activity"],
      pattern: `[${prop} = '${ioc.value}']`,
      pattern_type: "stix",
      valid_from: ioc.first_seen || now,
      created:    ioc.created_at || now,
      modified:   ioc.last_seen || ioc.created_at || now,
      confidence,
      labels,
    });
  }

  return { type: "bundle", id: `bundle--${randomUUID()}`, spec_version: "2.1", objects };
}

module.exports = { buildStixBundle };
