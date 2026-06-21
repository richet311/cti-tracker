const STIX_URL = "https://raw.githubusercontent.com/mitre/cti/master/enterprise-attack/enterprise-attack.json";
const CACHE_TTL = 24 * 60 * 60 * 1000;

let _cache   = null;
let _cacheAt = 0;

async function fetchMitreData() {
  const now = Date.now();
  if (_cache && now - _cacheAt < CACHE_TTL) return _cache;

  const res = await fetch(STIX_URL, { signal: AbortSignal.timeout(60_000) });
  if (!res.ok) throw new Error(`MITRE ATT&CK fetch failed (${res.status})`);
  const bundle = await res.json();

  const tacticMap = {};
  for (const obj of bundle.objects) {
    if (obj.type !== "x-mitre-tactic" || obj.revoked || obj.x_mitre_deprecated) continue;
    const extRef = (obj.external_references ?? []).find((r) => r.source_name === "mitre-attack");
    tacticMap[obj.x_mitre_shortname] = {
      id:        extRef?.external_id ?? "",
      label:     obj.name,
      shortname: obj.x_mitre_shortname,
    };
  }

  const techniques = [];
  for (const obj of bundle.objects) {
    if (
      obj.type !== "attack-pattern" ||
      obj.revoked ||
      obj.x_mitre_deprecated ||
      obj.x_mitre_is_subtechnique
    ) continue;
    const extRef = (obj.external_references ?? []).find((r) => r.source_name === "mitre-attack");
    const tid = extRef?.external_id ?? "";
    if (!tid) continue;
    const tactics = (obj.kill_chain_phases ?? [])
      .filter((p) => p.kill_chain_name === "mitre-attack")
      .map((p) => p.phase_name);
    if (!tactics.length) continue;
    techniques.push({ id: tid, name: obj.name, tactics });
  }

  techniques.sort((a, b) => a.id.localeCompare(b.id));

  _cache   = { tactics: tacticMap, techniques };
  _cacheAt = now;
  console.log(`[MITRE] Loaded ${techniques.length} techniques across ${Object.keys(tacticMap).length} tactics`);
  return _cache;
}

module.exports = { fetchMitreData };
