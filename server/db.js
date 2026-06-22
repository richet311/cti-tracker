const { createClient } = require("@supabase/supabase-js");
const { hashPassword } = require("./auth");

const SUPABASE_URL = (process.env.SUPABASE_URL || "").replace(/\/rest\/v1\/?$/, "");
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

async function initDb() {
  await _seedAdmin();
}

async function _seedAdmin() {
  const existing = await getUserByUsername("admin");
  if (existing) return;
  await createUser("admin", "admin@cti-tracker.local", "changeme", "admin");
}

// ── IOCs ──────────────────────────────────────────────────────────────────────

async function upsertIoc(value, iocType, opts = {}) {
  const o = { ...opts };
  if (typeof o.tags === "string") {
    try { o.tags = JSON.parse(o.tags); } catch { o.tags = []; }
  }
  if (typeof o.raw_data === "string") {
    try { o.raw_data = JSON.parse(o.raw_data); } catch { o.raw_data = null; }
  }

  const { data: existing } = await supabase
    .from("iocs")
    .select("id, source_count")
    .eq("value", value)
    .maybeSingle();

  if (existing) {
    const { source_count, ...updates } = o;
    await supabase
      .from("iocs")
      .update({ ...updates, last_seen: new Date().toISOString(), source_count: (existing.source_count || 1) + 1 })
      .eq("value", value);
    return { id: existing.id, isNew: false };
  }

  const { data } = await supabase
    .from("iocs")
    .insert({ value, ioc_type: iocType, ...o })
    .select("id")
    .single();
  return { id: data?.id ?? null, isNew: data != null };
}

async function getIocById(id) {
  const { data } = await supabase.from("iocs").select("*").eq("id", id).maybeSingle();
  return data ?? null;
}

async function listIocs(iocType = null, limit = 50) {
  let query = supabase.from("iocs").select("*").order("created_at", { ascending: false }).limit(limit);
  if (iocType) query = query.eq("ioc_type", iocType);
  const { data } = await query;
  return data ?? [];
}

async function searchIocs({ q, ioc_type, severity, source, malware_family, max_confidence = null, limit = 100 } = {}) {
  let query = supabase
    .from("iocs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (q) {
    query = query.or(`value.ilike.*${q}*,malware_family.ilike.*${q}*,threat_type.ilike.*${q}*`);
  }
  if (ioc_type)                         query = query.eq("ioc_type", ioc_type);
  if (severity)                         query = query.eq("severity", severity);
  if (source)                           query = query.ilike("source", `%${source}%`);
  if (malware_family)                   query = query.ilike("malware_family", `%${malware_family}%`);
  if (max_confidence != null)           query = query.lte("confidence", max_confidence);

  const { data } = await query;
  return data ?? [];
}

// ── Notes ─────────────────────────────────────────────────────────────────────

async function addIocNote(iocId, author, content) {
  const { data } = await supabase
    .from("ioc_notes")
    .insert({ ioc_id: iocId, author, content })
    .select("id")
    .single();
  return data?.id ?? null;
}

async function getIocNotes(iocId) {
  const { data } = await supabase
    .from("ioc_notes")
    .select("*")
    .eq("ioc_id", iocId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

// ── Watchlist ─────────────────────────────────────────────────────────────────

async function addToWatchlist(iocId, addedBy = "system", reason = "", priority = "medium") {
  const { data } = await supabase
    .from("watchlist")
    .upsert({ ioc_id: iocId, added_by: addedBy, reason, priority }, { onConflict: "ioc_id" })
    .select("id")
    .single();
  return data?.id ?? null;
}

async function removeFromWatchlist(iocId) {
  await supabase.from("watchlist").delete().eq("ioc_id", iocId);
}

async function getWatchlist() {
  const { data } = await supabase
    .from("watchlist_view")
    .select("*")
    .order("added_at", { ascending: false });
  return data ?? [];
}

async function isOnWatchlist(iocId) {
  const { data } = await supabase
    .from("watchlist")
    .select("id")
    .eq("ioc_id", iocId)
    .maybeSingle();
  return !!data;
}

// ── Users ─────────────────────────────────────────────────────────────────────

async function createUser(username, email, passwordPlain, role = "analyst") {
  const { data } = await supabase
    .from("users")
    .insert({ username, email, password_hash: hashPassword(passwordPlain), role })
    .select("id")
    .single();
  return data?.id ?? null;
}

async function getUserByUsername(username) {
  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("username", username)
    .eq("is_active", true)
    .maybeSingle();
  return data ?? null;
}

async function getUserByEmail(email) {
  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .eq("is_active", true)
    .maybeSingle();
  return data ?? null;
}

async function updateLastLogin(username) {
  await supabase
    .from("users")
    .update({ last_login: new Date().toISOString() })
    .eq("username", username);
}

async function updatePassword(username, newHashedPassword) {
  await supabase
    .from("users")
    .update({ password_hash: newHashedPassword })
    .eq("username", username);
}

async function listUsers() {
  const { data } = await supabase
    .from("users")
    .select("id, username, email, role, is_active, created_at, last_login")
    .order("created_at", { ascending: false });
  return data ?? [];
}

// ── Audit ─────────────────────────────────────────────────────────────────────

async function logAudit(actor, action, targetType = null, targetId = null, details = null) {
  await supabase.from("audit_log").insert({
    actor, action,
    target_type: targetType,
    target_id:   targetId,
    details:     details ?? null,
  });
}

async function getAuditLog(limit = 100, actor = null) {
  let query = supabase
    .from("audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (actor) query = query.eq("actor", actor);
  const { data } = await query;
  return data ?? [];
}

// ── Campaigns ─────────────────────────────────────────────────────────────────

async function createCampaign(name, threatActor = null, motivation = "unknown", status = "active", description = null) {
  const { data } = await supabase
    .from("campaigns")
    .insert({ name, threat_actor: threatActor, motivation, status, description })
    .select("id")
    .single();
  return data?.id ?? null;
}

async function listCampaigns() {
  const { data } = await supabase
    .from("campaigns_view")
    .select("*")
    .order("updated_at", { ascending: false });
  return data ?? [];
}

async function getCampaign(id) {
  const { data } = await supabase.from("campaigns").select("*").eq("id", id).maybeSingle();
  return data ?? null;
}

async function deleteIoc(id) {
  await supabase.from("iocs").delete().eq("id", id);
}

async function deleteCampaign(id) {
  await supabase.from("campaigns").delete().eq("id", id);
}

async function deleteReport(id) {
  await supabase.from("reports").delete().eq("id", id);
}

async function addIocToCampaign(iocId, campaignId) {
  await supabase
    .from("campaign_iocs")
    .upsert({ ioc_id: iocId, campaign_id: campaignId }, { onConflict: "ioc_id,campaign_id" });
}

async function getCampaignIocs(campaignId) {
  const { data } = await supabase
    .from("campaign_iocs")
    .select("iocs(*)")
    .eq("campaign_id", campaignId);
  return (data ?? []).map((r) => r.iocs);
}

async function getCampaignTtps(campaignId) {
  const { data } = await supabase
    .from("campaign_ttps")
    .select("*")
    .eq("campaign_id", campaignId)
    .order("tactic")
    .order("technique_id");
  return data ?? [];
}

async function removeIocFromCampaign(iocId, campaignId) {
  await supabase
    .from("campaign_iocs")
    .delete()
    .eq("ioc_id", iocId)
    .eq("campaign_id", campaignId);
}

async function listAllTtps() {
  const { data } = await supabase
    .from("campaign_ttps")
    .select("*")
    .order("tactic")
    .order("technique_id");
  return data ?? [];
}

async function addCampaignTtp(campaignId, { technique_id, technique_name, tactic }) {
  await supabase
    .from("campaign_ttps")
    .upsert(
      { campaign_id: campaignId, technique_id, technique_name, tactic },
      { onConflict: "campaign_id,technique_id" }
    );
}

async function removeCampaignTtp(campaignId, techniqueId) {
  await supabase
    .from("campaign_ttps")
    .delete()
    .eq("campaign_id", campaignId)
    .eq("technique_id", techniqueId);
}

// ── Reports ───────────────────────────────────────────────────────────────────

async function getReport(id) {
  const { data } = await supabase.from("reports").select("*").eq("id", id).maybeSingle();
  return data ?? null;
}

async function listReports() {
  const { data } = await supabase
    .from("reports_view")
    .select("*")
    .order("created_at", { ascending: false });
  return data ?? [];
}

async function saveReport(title, content, campaignId = null, reportType = "tactical", tlp = "TLP:WHITE") {
  const { data } = await supabase
    .from("reports")
    .insert({ title, content, campaign_id: campaignId, report_type: reportType, tlp })
    .select("id")
    .single();
  return data?.id ?? null;
}

// ── Stats ─────────────────────────────────────────────────────────────────────

async function getStats() {
  const { data, error } = await supabase.rpc("get_stats");
  if (error) throw error;
  return data;
}

module.exports = {
  initDb,
  upsertIoc, getIocById, listIocs, searchIocs,
  addIocNote, getIocNotes,
  addToWatchlist, removeFromWatchlist, getWatchlist, isOnWatchlist,
  createUser, getUserByUsername, getUserByEmail, updateLastLogin, updatePassword, listUsers,
  logAudit, getAuditLog,
  deleteIoc, deleteCampaign, deleteReport,
  createCampaign, listCampaigns, getCampaign, addIocToCampaign, getCampaignIocs, getCampaignTtps,
  removeIocFromCampaign, addCampaignTtp, removeCampaignTtp, listAllTtps,
  getReport, listReports, saveReport,
  getStats,
};
