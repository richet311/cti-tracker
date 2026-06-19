"""
SQLite schema for the CTI Tracker.

Tables
------
iocs            Indicators of Compromise: hashes, IPs, domains, URLs
campaigns       Named adversary clusters / threat campaigns
campaign_iocs   Many-to-many link between campaigns and IOCs
campaign_ttps   MITRE ATT&CK techniques attributed to a campaign
reports         Finished intelligence reports (stored as Markdown text)
users           Platform users with role-based access
ioc_notes       Analyst annotations on specific IOCs
watchlist       High-priority IOCs flagged for active monitoring
audit_log       Immutable record of all analyst actions

In production CTI platforms (MISP, OpenCTI) these relationships map to
STIX Domain Objects and STIX Relationships. This SQLite schema is a
lightweight stand-in that mirrors the same conceptual model.
"""

SCHEMA = """
CREATE TABLE IF NOT EXISTS iocs (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    value          TEXT    NOT NULL UNIQUE,
    ioc_type       TEXT    NOT NULL,
    -- ioc_type: hash_md5 | hash_sha1 | hash_sha256 | ip | domain | url
    malware_family TEXT,
    threat_type    TEXT,
    confidence     INTEGER NOT NULL DEFAULT 50,
    -- confidence 0–100: certainty that this indicator is malicious
    severity       TEXT    NOT NULL DEFAULT 'medium',
    -- severity: low | medium | high | critical
    first_seen     TEXT,
    last_seen      TEXT,
    tags           TEXT,        -- JSON array stored as text
    source         TEXT,        -- malwarebazaar | urlhaus | feodotracker | manual
    source_count   INTEGER NOT NULL DEFAULT 1,
    raw_data       TEXT,        -- JSON blob from original API response
    created_at     TEXT    DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS campaigns (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    name         TEXT    NOT NULL UNIQUE,
    description  TEXT,
    threat_actor TEXT,
    motivation   TEXT    DEFAULT 'unknown',
    -- motivation: espionage | financial | disruptive | hacktivism | unknown
    status       TEXT    DEFAULT 'active',
    -- status: active | dormant | historical
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
    -- role: admin | analyst | viewer
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
    -- priority: low | medium | high
    added_at   TEXT    DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS audit_log (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    actor       TEXT    NOT NULL DEFAULT 'system',
    action      TEXT    NOT NULL,
    -- action: collect | note | watchlist | report | login | register
    target_type TEXT,
    target_id   INTEGER,
    details     TEXT,   -- JSON
    created_at  TEXT    DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_iocs_value  ON iocs(value);
CREATE INDEX IF NOT EXISTS idx_iocs_type   ON iocs(ioc_type);
CREATE INDEX IF NOT EXISTS idx_iocs_family ON iocs(malware_family);
CREATE INDEX IF NOT EXISTS idx_notes_ioc   ON ioc_notes(ioc_id);
CREATE INDEX IF NOT EXISTS idx_audit_actor   ON audit_log(actor);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at);
"""

# Applied after SCHEMA so existing databases pick up new columns without
# recreating the iocs table. Each statement is run in a try/except so
# re-running init_db() on an already-migrated database is safe.
MIGRATIONS = [
    "ALTER TABLE iocs ADD COLUMN confidence   INTEGER NOT NULL DEFAULT 50",
    "ALTER TABLE iocs ADD COLUMN severity     TEXT    NOT NULL DEFAULT 'medium'",
    "ALTER TABLE iocs ADD COLUMN source_count INTEGER NOT NULL DEFAULT 1",
    "CREATE INDEX IF NOT EXISTS idx_iocs_severity ON iocs(severity)",
]
