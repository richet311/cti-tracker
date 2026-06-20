const { lookupHash, lookupUrl: mbLookupUrl } = require("../collectors/malwarebazaar");
const { lookupUrl, lookupHost } = require("../collectors/urlhaus");

const RE_MD5    = /^[a-fA-F0-9]{32}$/;
const RE_SHA1   = /^[a-fA-F0-9]{40}$/;
const RE_SHA256 = /^[a-fA-F0-9]{64}$/;
const RE_IP     = /^\d{1,3}(\.\d{1,3}){3}$/;
const RE_URL    = /^https?:\/\//i;
const RE_DOMAIN = /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

function detectIocType(value) {
  const v = value.trim();
  if (RE_MD5.test(v))    return "hash_md5";
  if (RE_SHA1.test(v))   return "hash_sha1";
  if (RE_SHA256.test(v)) return "hash_sha256";
  if (RE_IP.test(v))     return "ip";
  if (RE_URL.test(v))    return "url";
  if (RE_DOMAIN.test(v)) return "domain";
  return "unknown";
}

async function analyzeIoc(value) {
  const iocType = detectIocType(value);
  const result = {
    value,
    type:           iocType,
    sources:        [],
    malware_family: null,
    threat_type:    null,
    tags:           [],
    first_seen:     null,
    last_seen:      null,
    raw:            {},
  };

  if (["hash_md5", "hash_sha1", "hash_sha256"].includes(iocType)) {
    const data = await lookupHash(value);
    if (data) {
      result.sources.push("MalwareBazaar");
      result.malware_family = data.signature ?? null;
      result.tags           = data.tags ?? [];
      result.threat_type    = result.tags[0] ?? null;
      result.first_seen     = data.first_seen ?? null;
      result.last_seen      = data.last_seen ?? null;
      result.raw.malwarebazaar = data;
    }
  } else if (["ip", "domain"].includes(iocType)) {
    const data = await lookupHost(value);
    if (data) {
      result.sources.push("URLhaus");
      const urls = data.urls ?? [];
      if (urls.length) {
        result.threat_type = urls[0].threat ?? null;
        result.tags = [...new Set(urls.flatMap((u) => u.tags ?? []))];
      }
      result.first_seen = data.first_seen ?? null;
      result.last_seen  = data.last_seen ?? null;
      result.raw.urlhaus = data;
    }
  } else if (iocType === "url") {
    const data = await lookupUrl(value);
    if (data) {
      result.sources.push("URLhaus");
      result.threat_type = data.threat ?? null;
      result.tags        = data.tags ?? [];
      result.first_seen  = data.date_added ?? null;
      result.raw.urlhaus = data;
    }
  }

  return result;
}

module.exports = { detectIocType, analyzeIoc };
