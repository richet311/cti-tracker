-- CTI Tracker — Supabase schema
-- Run this once in the Supabase SQL editor (Database → SQL Editor → New query)

-- ── Tables ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS iocs (
  id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  value          TEXT    NOT NULL UNIQUE,
  ioc_type       TEXT    NOT NULL,
  malware_family TEXT,
  threat_type    TEXT,
  confidence     INTEGER NOT NULL DEFAULT 50,
  severity       TEXT    NOT NULL DEFAULT 'medium',
  first_seen     TEXT,
  last_seen      TEXT,
  tags           JSONB,
  source         TEXT,
  source_count   INTEGER NOT NULL DEFAULT 1,
  raw_data       JSONB,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaigns (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name         TEXT NOT NULL UNIQUE,
  description  TEXT,
  threat_actor TEXT,
  motivation   TEXT DEFAULT 'unknown',
  status       TEXT DEFAULT 'active',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaign_iocs (
  campaign_id BIGINT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  ioc_id      BIGINT NOT NULL REFERENCES iocs(id)      ON DELETE CASCADE,
  notes       TEXT,
  added_at    TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (campaign_id, ioc_id)
);

CREATE TABLE IF NOT EXISTS campaign_ttps (
  campaign_id    BIGINT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  technique_id   TEXT   NOT NULL,
  technique_name TEXT,
  tactic         TEXT,
  notes          TEXT,
  added_at       TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (campaign_id, technique_id)
);

CREATE TABLE IF NOT EXISTS reports (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title       TEXT NOT NULL,
  campaign_id BIGINT REFERENCES campaigns(id),
  content     TEXT,
  report_type TEXT DEFAULT 'tactical',
  tlp         TEXT DEFAULT 'TLP:WHITE',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  username      TEXT    NOT NULL UNIQUE,
  email         TEXT    NOT NULL UNIQUE,
  password_hash TEXT    NOT NULL,
  role          TEXT    NOT NULL DEFAULT 'analyst',
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  last_login    TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS ioc_notes (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ioc_id     BIGINT NOT NULL REFERENCES iocs(id) ON DELETE CASCADE,
  author     TEXT   NOT NULL DEFAULT 'system',
  content    TEXT   NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS watchlist (
  id       BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ioc_id   BIGINT NOT NULL UNIQUE REFERENCES iocs(id) ON DELETE CASCADE,
  added_by TEXT   NOT NULL DEFAULT 'system',
  reason   TEXT,
  priority TEXT   NOT NULL DEFAULT 'medium',
  added_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_log (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor       TEXT  NOT NULL DEFAULT 'system',
  action      TEXT  NOT NULL,
  target_type TEXT,
  target_id   BIGINT,
  details     JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_iocs_value    ON iocs(value);
CREATE INDEX IF NOT EXISTS idx_iocs_type     ON iocs(ioc_type);
CREATE INDEX IF NOT EXISTS idx_iocs_family   ON iocs(malware_family);
CREATE INDEX IF NOT EXISTS idx_iocs_severity ON iocs(severity);
CREATE INDEX IF NOT EXISTS idx_notes_ioc     ON ioc_notes(ioc_id);
CREATE INDEX IF NOT EXISTS idx_audit_actor   ON audit_log(actor);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at);

-- ── Views ─────────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW watchlist_view AS
SELECT
  w.id, w.ioc_id, w.added_by, w.reason, w.priority, w.added_at,
  i.value, i.ioc_type, i.malware_family, i.severity, i.confidence, i.source
FROM watchlist w
JOIN iocs i ON w.ioc_id = i.id;

CREATE OR REPLACE VIEW campaigns_view AS
SELECT
  c.*,
  COUNT(DISTINCT ci.ioc_id)::int      AS ioc_count,
  COUNT(DISTINCT ct.technique_id)::int AS ttp_count
FROM campaigns c
LEFT JOIN campaign_iocs ci ON c.id = ci.campaign_id
LEFT JOIN campaign_ttps  ct ON c.id = ct.campaign_id
GROUP BY c.id;

CREATE OR REPLACE VIEW reports_view AS
SELECT r.id, r.title, r.report_type, r.tlp, r.created_at,
       c.name AS campaign_name
FROM reports r
LEFT JOIN campaigns c ON r.campaign_id = c.id;

-- ── Functions ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_stats()
RETURNS JSON
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT json_build_object(
    'total_iocs',      (SELECT COUNT(*)::int FROM iocs),
    'total_campaigns', (SELECT COUNT(*)::int FROM campaigns),
    'total_reports',   (SELECT COUNT(*)::int FROM reports),
    'total_watchlist', (SELECT COUNT(*)::int FROM watchlist),
    'ioc_types',       (SELECT COALESCE(json_agg(r), '[]'::json) FROM (
                          SELECT ioc_type, COUNT(*)::int AS cnt FROM iocs
                          GROUP BY ioc_type ORDER BY cnt DESC
                        ) r),
    'severity_counts', (SELECT COALESCE(json_agg(r), '[]'::json) FROM (
                          SELECT severity, COUNT(*)::int AS cnt FROM iocs
                          GROUP BY severity ORDER BY cnt DESC
                        ) r),
    'top_families',    (SELECT COALESCE(json_agg(r), '[]'::json) FROM (
                          SELECT malware_family, COUNT(*)::int AS cnt FROM iocs
                          WHERE malware_family IS NOT NULL
                          GROUP BY malware_family ORDER BY cnt DESC LIMIT 10
                        ) r),
    'source_counts',   (SELECT COALESCE(json_agg(r), '[]'::json) FROM (
                          SELECT source, COUNT(*)::int AS cnt FROM iocs
                          GROUP BY source ORDER BY cnt DESC
                        ) r)
  );
$$;
