"""
SQLite schema for the CTI Tracker.

Tables
------
iocs            Indicators of Compromise: hashes, IPs, domains, URLs
campaigns       Named adversary clusters / threat campaigns
campaign_iocs   Many-to-many link between campaigns and IOCs
campaign_ttps   MITRE ATT&CK techniques attributed to a campaign
reports         Finished intelligence reports (stored as Markdown text)

In real CTI platforms (e.g. MISP, OpenCTI) these relationships map to
STIX Domain Objects and STIX Relationships. This SQLite schema is a
lightweight stand-in that mirrors the same conceptual model.
"""

SCHEMA = """
CREATE TABLE IF NOT EXISTS iocs (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    value          TEXT    NOT NULL UNIQUE,
    ioc_type       TEXT    NOT NULL,
    -- ioc_type values: hash_md5, hash_sha1, hash_sha256, ip, domain, url
    malware_family TEXT,
    threat_type    TEXT,
    first_seen     TEXT,
    last_seen      TEXT,
    tags           TEXT,   -- JSON array stored as text
    source         TEXT,   -- 'malwarebazaar' | 'urlhaus' | 'manual'
    raw_data       TEXT,   -- JSON blob from original API response
    created_at     TEXT    DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS campaigns (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    name         TEXT    NOT NULL UNIQUE,
    description  TEXT,
    threat_actor TEXT,
    motivation   TEXT    DEFAULT 'unknown',
    -- motivation values: espionage, financial, disruptive, hacktivism, unknown
    status       TEXT    DEFAULT 'active',
    -- status values:    active, dormant, historical
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

CREATE INDEX IF NOT EXISTS idx_iocs_value  ON iocs(value);
CREATE INDEX IF NOT EXISTS idx_iocs_type   ON iocs(ioc_type);
CREATE INDEX IF NOT EXISTS idx_iocs_family ON iocs(malware_family);
"""
