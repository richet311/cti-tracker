const { DatabaseSync } = require("node:sqlite");
const fs   = require("fs");
const path = require("path");
const { hashPassword } = require("./auth");

const DATA_DIR = path.join(__dirname, "..", "data");
const DB_PATH  = path.join(DATA_DIR, "cti_tracker.db");

fs.mkdirSync(DATA_DIR, { recursive: true });

let _db;
function getDb() {
  if (!_db) {
    _db = new DatabaseSync(DB_PATH);
    _db.exec("PRAGMA foreign_keys = ON");
    _db.exec("PRAGMA journal_mode = WAL");
  }
  return _db;
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS iocs (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  value          TEXT    NOT NULL UNIQUE,
  ioc_type       TEXT    NOT NULL,
  malware_family TEXT,
  threat_type    TEXT,
  confidence     INTEGER NOT NULL DEFAULT 50,
  severity       TEXT    NOT NULL DEFAULT 'medium',
  first_seen     TEXT,
  last_seen      TEXT,
  tags           TEXT,
  source         TEXT,
  source_count   INTEGER NOT NULL DEFAULT 1,
  raw_data       TEXT,
  created_at     TEXT    DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS campaigns (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT    NOT NULL UNIQUE,
  description  TEXT,
  threat_actor TEXT,
  motivation   TEXT    DEFAULT 'unknown',
  status       TEXT    DEFAULT 'active',
  created_at   TEXT    DEFAULT (datetime('now')),
  updated_at   TEXT    DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS campaign_iocs (
  campaign_id  INTEGER NOT NULL REFERENCES campaigns(id),
  ioc_id       INTEGER NOT NULL REFERENCES iocs(id),
  notes        TEXT,
  added_at     TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (campaign_id, ioc_id)
);
CREATE TABLE IF NOT EXISTS campaign_ttps (
  campaign_id    INTEGER NOT NULL REFERENCES campaigns(id),
  technique_id   TEXT    NOT NULL,
  technique_name TEXT,
  tactic         TEXT,
  notes          TEXT,
  added_at       TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (campaign_id, technique_id)
);
CREATE TABLE IF NOT EXISTS reports (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  title        TEXT NOT NULL,
  campaign_id  INTEGER REFERENCES campaigns(id),
  content      TEXT,
  report_type  TEXT DEFAULT 'tactical',
  tlp          TEXT DEFAULT 'TLP:WHITE',
  created_at   TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT    NOT NULL UNIQUE,
  email         TEXT    NOT NULL UNIQUE,
  password_hash TEXT    NOT NULL,
  role          TEXT    NOT NULL DEFAULT 'analyst',
  is_active     INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT    DEFAULT (datetime('now')),
  last_login    TEXT
);
CREATE TABLE IF NOT EXISTS ioc_notes (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  ioc_id     INTEGER NOT NULL REFERENCES iocs(id) ON DELETE CASCADE,
  author     TEXT    NOT NULL DEFAULT 'system',
  content    TEXT    NOT NULL,
  created_at TEXT    DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS watchlist (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  ioc_id     INTEGER NOT NULL UNIQUE REFERENCES iocs(id) ON DELETE CASCADE,
  added_by   TEXT    NOT NULL DEFAULT 'system',
  reason     TEXT,
  priority   TEXT    NOT NULL DEFAULT 'medium',
  added_at   TEXT    DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS audit_log (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  actor       TEXT    NOT NULL DEFAULT 'system',
  action      TEXT    NOT NULL,
  target_type TEXT,
  target_id   INTEGER,
  details     TEXT,
  created_at  TEXT    DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_iocs_value    ON iocs(value);
CREATE INDEX IF NOT EXISTS idx_iocs_type     ON iocs(ioc_type);
CREATE INDEX IF NOT EXISTS idx_iocs_family   ON iocs(malware_family);
CREATE INDEX IF NOT EXISTS idx_iocs_severity ON iocs(severity);
CREATE INDEX IF NOT EXISTS idx_notes_ioc     ON ioc_notes(ioc_id);
CREATE INDEX IF NOT EXISTS idx_audit_actor   ON audit_log(actor);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at);
`;

const MIGRATIONS = [
  "ALTER TABLE iocs ADD COLUMN confidence   INTEGER NOT NULL DEFAULT 50",
  "ALTER TABLE iocs ADD COLUMN severity     TEXT    NOT NULL DEFAULT 'medium'",
  "ALTER TABLE iocs ADD COLUMN source_count INTEGER NOT NULL DEFAULT 1",
  "CREATE INDEX IF NOT EXISTS idx_iocs_severity ON iocs(severity)",
];

function initDb() {
  const db = getDb();
  db.exec(SCHEMA);
  for (const stmt of MIGRATIONS) {
    try { db.exec(stmt); } catch { /* column already exists */ }
  }
  _seedAdmin();
}

function _seedAdmin() {
  if (getUserByUsername("admin")) return;
  createUser("admin", "admin@cti-tracker.local", "changeme", "admin");
}

// ── IOCs ──────────────────────────────────────────────────────────────────────

function upsertIoc(value, iocType, opts = {}) {
  const db = getDb();
  const o = { ...opts };
  if (Array.isArray(o.tags)) o.tags = JSON.stringify(o.tags);
  if (o.raw_data && typeof o.raw_data === "object") o.raw_data = JSON.stringify(o.raw_data);

  const existing = db.prepare("SELECT id FROM iocs WHERE value = ?").get(value);
  if (existing) {
    const updateKeys = Object.keys(o).filter((k) => k !== "source_count");
    if (updateKeys.length) {
      const sets = updateKeys.map((k) => `${k} = @${k}`).join(", ");
      db.prepare(
        `UPDATE iocs SET ${sets}, last_seen = datetime('now'), source_count = source_count + 1 WHERE value = @value`
      ).run({ ...o, value });
    }
    return Number(existing.id);
  }

  const cols = ["value", "ioc_type", ...Object.keys(o)];
  const placeholders = cols.map((c) => `@${c}`).join(", ");
  const result = db
    .prepare(`INSERT INTO iocs (${cols.join(", ")}) VALUES (${placeholders})`)
    .run({ value, ioc_type: iocType, ...o });
  return Number(result.lastInsertRowid);
}

function getIocById(id) {
  return getDb().prepare("SELECT * FROM iocs WHERE id = ?").get(id) ?? null;
}

function listIocs(iocType = null, limit = 50) {
  const db = getDb();
  if (iocType) {
    return db.prepare("SELECT * FROM iocs WHERE ioc_type = ? ORDER BY created_at DESC LIMIT ?").all(iocType, limit);
  }
  return db.prepare("SELECT * FROM iocs ORDER BY created_at DESC LIMIT ?").all(limit);
}

function searchIocs({ q, ioc_type, severity, source, malware_family, min_confidence = 0, limit = 100 } = {}) {
  const clauses = ["confidence >= ?"];
  const params  = [min_confidence];

  if (q) {
    clauses.push("(value LIKE ? OR malware_family LIKE ? OR threat_type LIKE ?)");
    const like = `%${q}%`;
    params.push(like, like, like);
  }
  if (ioc_type)       { clauses.push("ioc_type = ?");         params.push(ioc_type); }
  if (severity)       { clauses.push("severity = ?");          params.push(severity); }
  if (source)         { clauses.push("source LIKE ?");         params.push(`%${source}%`); }
  if (malware_family) { clauses.push("malware_family LIKE ?"); params.push(`%${malware_family}%`); }

  params.push(limit);
  return getDb()
    .prepare(`SELECT * FROM iocs WHERE ${clauses.join(" AND ")} ORDER BY severity DESC, confidence DESC LIMIT ?`)
    .all(...params);
}

// ── Notes ─────────────────────────────────────────────────────────────────────

function addIocNote(iocId, author, content) {
  const r = getDb().prepare("INSERT INTO ioc_notes (ioc_id, author, content) VALUES (?, ?, ?)").run(iocId, author, content);
  return Number(r.lastInsertRowid);
}

function getIocNotes(iocId) {
  return getDb().prepare("SELECT * FROM ioc_notes WHERE ioc_id = ? ORDER BY created_at DESC").all(iocId);
}

// ── Watchlist ─────────────────────────────────────────────────────────────────

function addToWatchlist(iocId, addedBy = "system", reason = "", priority = "medium") {
  const r = getDb().prepare("INSERT OR REPLACE INTO watchlist (ioc_id, added_by, reason, priority) VALUES (?, ?, ?, ?)").run(iocId, addedBy, reason, priority);
  return Number(r.lastInsertRowid);
}

function removeFromWatchlist(iocId) {
  getDb().prepare("DELETE FROM watchlist WHERE ioc_id = ?").run(iocId);
}

function getWatchlist() {
  return getDb().prepare(`
    SELECT w.*, i.value, i.ioc_type, i.malware_family, i.severity, i.confidence, i.source
    FROM watchlist w JOIN iocs i ON w.ioc_id = i.id
    ORDER BY CASE w.priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END, w.added_at DESC
  `).all();
}

function isOnWatchlist(iocId) {
  return !!getDb().prepare("SELECT 1 FROM watchlist WHERE ioc_id = ?").get(iocId);
}

// ── Users ─────────────────────────────────────────────────────────────────────

function createUser(username, email, passwordPlain, role = "analyst") {
  const r = getDb().prepare("INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)").run(username, email, hashPassword(passwordPlain), role);
  return Number(r.lastInsertRowid);
}

function getUserByUsername(username) {
  return getDb().prepare("SELECT * FROM users WHERE username = ? AND is_active = 1").get(username) ?? null;
}

function getUserByEmail(email) {
  return getDb().prepare("SELECT * FROM users WHERE email = ? AND is_active = 1").get(email) ?? null;
}

function updateLastLogin(username) {
  getDb().prepare("UPDATE users SET last_login = datetime('now') WHERE username = ?").run(username);
}

function updatePassword(username, newHashedPassword) {
  getDb().prepare("UPDATE users SET password_hash = ? WHERE username = ?").run(newHashedPassword, username);
}

function listUsers() {
  return getDb().prepare("SELECT id, username, email, role, is_active, created_at, last_login FROM users ORDER BY created_at DESC").all();
}

// ── Audit ─────────────────────────────────────────────────────────────────────

function logAudit(actor, action, targetType = null, targetId = null, details = null) {
  getDb().prepare("INSERT INTO audit_log (actor, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)").run(
    actor, action, targetType, targetId, details ? JSON.stringify(details) : null
  );
}

function getAuditLog(limit = 100, actor = null) {
  if (actor) {
    return getDb().prepare("SELECT * FROM audit_log WHERE actor = ? ORDER BY created_at DESC LIMIT ?").all(actor, limit);
  }
  return getDb().prepare("SELECT * FROM audit_log ORDER BY created_at DESC LIMIT ?").all(limit);
}

// ── Campaigns ─────────────────────────────────────────────────────────────────

function listCampaigns() {
  return getDb().prepare(`
    SELECT c.*, COUNT(DISTINCT ci.ioc_id) AS ioc_count, COUNT(DISTINCT ct.technique_id) AS ttp_count
    FROM campaigns c
    LEFT JOIN campaign_iocs ci ON c.id = ci.campaign_id
    LEFT JOIN campaign_ttps  ct ON c.id = ct.campaign_id
    GROUP BY c.id ORDER BY c.updated_at DESC
  `).all();
}

function getCampaign(id) {
  return getDb().prepare("SELECT * FROM campaigns WHERE id = ?").get(id) ?? null;
}

function getCampaignIocs(campaignId) {
  return getDb().prepare("SELECT i.* FROM iocs i JOIN campaign_iocs ci ON i.id = ci.ioc_id WHERE ci.campaign_id = ?").all(campaignId);
}

function getCampaignTtps(campaignId) {
  return getDb().prepare("SELECT * FROM campaign_ttps WHERE campaign_id = ? ORDER BY tactic, technique_id").all(campaignId);
}

// ── Reports ───────────────────────────────────────────────────────────────────

function listReports() {
  return getDb().prepare(`
    SELECT r.id, r.title, r.report_type, r.tlp, r.created_at, c.name AS campaign_name
    FROM reports r LEFT JOIN campaigns c ON r.campaign_id = c.id ORDER BY r.created_at DESC
  `).all();
}

function saveReport(title, content, campaignId = null, reportType = "tactical", tlp = "TLP:WHITE") {
  const r = getDb().prepare("INSERT INTO reports (title, content, campaign_id, report_type, tlp) VALUES (?, ?, ?, ?, ?)").run(title, content, campaignId, reportType, tlp);
  return Number(r.lastInsertRowid);
}

// ── Stats ─────────────────────────────────────────────────────────────────────

function getStats() {
  const db = getDb();
  return {
    total_iocs:      Number(db.prepare("SELECT COUNT(*) AS n FROM iocs").get().n),
    total_campaigns: Number(db.prepare("SELECT COUNT(*) AS n FROM campaigns").get().n),
    total_reports:   Number(db.prepare("SELECT COUNT(*) AS n FROM reports").get().n),
    total_watchlist: Number(db.prepare("SELECT COUNT(*) AS n FROM watchlist").get().n),
    ioc_types:       db.prepare("SELECT ioc_type, COUNT(*) AS cnt FROM iocs GROUP BY ioc_type ORDER BY cnt DESC").all(),
    severity_counts: db.prepare("SELECT severity, COUNT(*) AS cnt FROM iocs GROUP BY severity ORDER BY cnt DESC").all(),
    top_families:    db.prepare("SELECT malware_family, COUNT(*) AS cnt FROM iocs WHERE malware_family IS NOT NULL GROUP BY malware_family ORDER BY cnt DESC LIMIT 10").all(),
    source_counts:   db.prepare("SELECT source, COUNT(*) AS cnt FROM iocs GROUP BY source ORDER BY cnt DESC").all(),
  };
}

module.exports = {
  initDb,
  upsertIoc, getIocById, listIocs, searchIocs,
  addIocNote, getIocNotes,
  addToWatchlist, removeFromWatchlist, getWatchlist, isOnWatchlist,
  createUser, getUserByUsername, getUserByEmail, updateLastLogin, updatePassword, listUsers,
  logAudit, getAuditLog,
  listCampaigns, getCampaign, getCampaignIocs, getCampaignTtps,
  listReports, saveReport,
  getStats,
};
