"""
Database CRUD operations.

Every function either reads or writes to the SQLite database defined
in models.py. The context manager `get_conn` handles commit/rollback
automatically so callers never have to think about transaction state.
"""

import json
import sqlite3
from contextlib import contextmanager
from typing import Optional

from config import DB_PATH
from database.models import SCHEMA, MIGRATIONS


def init_db() -> None:
    """Create tables, indexes, and run column migrations. Idempotent."""
    with get_conn() as conn:
        conn.executescript(SCHEMA)
        for stmt in MIGRATIONS:
            try:
                conn.execute(stmt)
            except sqlite3.OperationalError:
                pass  # column already exists — safe to ignore

    _seed_admin()


def _seed_admin() -> None:
    """Create the default admin account on first run."""
    from api.auth import hash_password
    if get_user_by_username("admin"):
        return
    create_user(
        username="admin",
        email="admin@cti-tracker.local",
        password_plain="changeme",
        role="admin",
    )


@contextmanager
def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


# ── IOCs ──────────────────────────────────────────────────────────────────────

def upsert_ioc(value: str, ioc_type: str, **kwargs) -> int:
    """
    Insert a new IOC or update an existing one. Returns the row id.
    Serialises list/dict kwargs to JSON before storage.
    When the IOC already exists and a new source is provided, increments
    source_count so confidence can be boosted on multi-source corroboration.
    """
    if isinstance(kwargs.get("tags"), list):
        kwargs["tags"] = json.dumps(kwargs["tags"])
    if isinstance(kwargs.get("raw_data"), dict):
        kwargs["raw_data"] = json.dumps(kwargs["raw_data"])

    with get_conn() as conn:
        row = conn.execute(
            "SELECT id, source_count FROM iocs WHERE value = ?", (value,)
        ).fetchone()

        if row:
            update_kwargs = {k: v for k, v in kwargs.items() if k != "source_count"}
            if update_kwargs:
                sets = ", ".join(f"{k} = ?" for k in update_kwargs)
                vals = list(update_kwargs.values()) + [value]
                conn.execute(
                    f"UPDATE iocs SET {sets}, last_seen = datetime('now'),"
                    f" source_count = source_count + 1 WHERE value = ?",
                    vals,
                )
            return row["id"]

        cols = ["value", "ioc_type"] + list(kwargs.keys())
        placeholders = ", ".join("?" * len(cols))
        vals = [value, ioc_type] + list(kwargs.values())
        cur = conn.execute(
            f"INSERT INTO iocs ({', '.join(cols)}) VALUES ({placeholders})", vals
        )
        return cur.lastrowid


def get_ioc(value: str) -> Optional[dict]:
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM iocs WHERE value = ?", (value,)).fetchone()
        return dict(row) if row else None


def get_ioc_by_id(ioc_id: int) -> Optional[dict]:
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM iocs WHERE id = ?", (ioc_id,)).fetchone()
        return dict(row) if row else None


def list_iocs(ioc_type: Optional[str] = None, limit: int = 50) -> list[dict]:
    with get_conn() as conn:
        if ioc_type:
            rows = conn.execute(
                "SELECT * FROM iocs WHERE ioc_type = ? ORDER BY created_at DESC LIMIT ?",
                (ioc_type, limit),
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM iocs ORDER BY created_at DESC LIMIT ?", (limit,)
            ).fetchall()
        return [dict(r) for r in rows]


def search_iocs(
    q: Optional[str] = None,
    ioc_type: Optional[str] = None,
    severity: Optional[str] = None,
    source: Optional[str] = None,
    malware_family: Optional[str] = None,
    min_confidence: int = 0,
    limit: int = 100,
) -> list[dict]:
    """
    Flexible IOC search — the core analyst pivot query.
    Supports full-text search on value plus filtering on all key fields.
    """
    clauses: list[str] = ["confidence >= ?"]
    params: list = [min_confidence]

    if q:
        clauses.append("(value LIKE ? OR malware_family LIKE ? OR threat_type LIKE ?)")
        like = f"%{q}%"
        params += [like, like, like]
    if ioc_type:
        clauses.append("ioc_type = ?")
        params.append(ioc_type)
    if severity:
        clauses.append("severity = ?")
        params.append(severity)
    if source:
        clauses.append("source LIKE ?")
        params.append(f"%{source}%")
    if malware_family:
        clauses.append("malware_family LIKE ?")
        params.append(f"%{malware_family}%")

    where = "WHERE " + " AND ".join(clauses) if clauses else ""
    params.append(limit)

    with get_conn() as conn:
        rows = conn.execute(
            f"SELECT * FROM iocs {where} ORDER BY severity DESC, confidence DESC LIMIT ?",
            params,
        ).fetchall()
        return [dict(r) for r in rows]


# ── IOC Notes (analyst annotations) ──────────────────────────────────────────

def add_ioc_note(ioc_id: int, author: str, content: str) -> int:
    with get_conn() as conn:
        cur = conn.execute(
            "INSERT INTO ioc_notes (ioc_id, author, content) VALUES (?,?,?)",
            (ioc_id, author, content),
        )
        return cur.lastrowid


def get_ioc_notes(ioc_id: int) -> list[dict]:
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM ioc_notes WHERE ioc_id = ? ORDER BY created_at DESC",
            (ioc_id,),
        ).fetchall()
        return [dict(r) for r in rows]


# ── Watchlist ─────────────────────────────────────────────────────────────────

def add_to_watchlist(
    ioc_id: int,
    added_by: str = "system",
    reason: str = "",
    priority: str = "medium",
) -> int:
    with get_conn() as conn:
        cur = conn.execute(
            """INSERT OR REPLACE INTO watchlist (ioc_id, added_by, reason, priority)
               VALUES (?,?,?,?)""",
            (ioc_id, added_by, reason, priority),
        )
        return cur.lastrowid


def remove_from_watchlist(ioc_id: int) -> None:
    with get_conn() as conn:
        conn.execute("DELETE FROM watchlist WHERE ioc_id = ?", (ioc_id,))


def get_watchlist() -> list[dict]:
    with get_conn() as conn:
        rows = conn.execute(
            """SELECT w.*, i.value, i.ioc_type, i.malware_family,
                      i.severity, i.confidence, i.source
               FROM watchlist w
               JOIN iocs i ON w.ioc_id = i.id
               ORDER BY
                 CASE w.priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END,
                 w.added_at DESC"""
        ).fetchall()
        return [dict(r) for r in rows]


def is_on_watchlist(ioc_id: int) -> bool:
    with get_conn() as conn:
        row = conn.execute(
            "SELECT 1 FROM watchlist WHERE ioc_id = ?", (ioc_id,)
        ).fetchone()
        return row is not None


# ── Users ─────────────────────────────────────────────────────────────────────

def create_user(
    username: str,
    email: str,
    password_plain: str,
    role: str = "analyst",
) -> int:
    from api.auth import hash_password
    with get_conn() as conn:
        cur = conn.execute(
            "INSERT INTO users (username, email, password_hash, role) VALUES (?,?,?,?)",
            (username, email, hash_password(password_plain), role),
        )
        return cur.lastrowid


def get_user_by_username(username: str) -> Optional[dict]:
    with get_conn() as conn:
        row = conn.execute(
            "SELECT * FROM users WHERE username = ? AND is_active = 1", (username,)
        ).fetchone()
        return dict(row) if row else None


def update_last_login(username: str) -> None:
    with get_conn() as conn:
        conn.execute(
            "UPDATE users SET last_login = datetime('now') WHERE username = ?",
            (username,),
        )


def list_users() -> list[dict]:
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT id, username, email, role, is_active, created_at, last_login"
            " FROM users ORDER BY created_at DESC"
        ).fetchall()
        return [dict(r) for r in rows]


# ── Audit Log ─────────────────────────────────────────────────────────────────

def log_audit(
    actor: str,
    action: str,
    target_type: Optional[str] = None,
    target_id: Optional[int] = None,
    details: Optional[dict] = None,
) -> None:
    with get_conn() as conn:
        conn.execute(
            """INSERT INTO audit_log (actor, action, target_type, target_id, details)
               VALUES (?,?,?,?,?)""",
            (actor, action, target_type, target_id, json.dumps(details) if details else None),
        )


def get_audit_log(limit: int = 100, actor: Optional[str] = None) -> list[dict]:
    with get_conn() as conn:
        if actor:
            rows = conn.execute(
                "SELECT * FROM audit_log WHERE actor = ? ORDER BY created_at DESC LIMIT ?",
                (actor, limit),
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM audit_log ORDER BY created_at DESC LIMIT ?", (limit,)
            ).fetchall()
        return [dict(r) for r in rows]


# ── Campaigns ─────────────────────────────────────────────────────────────────

def create_campaign(
    name: str,
    description: str = "",
    threat_actor: str = "",
    motivation: str = "unknown",
) -> int:
    with get_conn() as conn:
        cur = conn.execute(
            "INSERT INTO campaigns (name, description, threat_actor, motivation) VALUES (?,?,?,?)",
            (name, description, threat_actor, motivation),
        )
        return cur.lastrowid


def get_campaign(campaign_id: int) -> Optional[dict]:
    with get_conn() as conn:
        row = conn.execute(
            "SELECT * FROM campaigns WHERE id = ?", (campaign_id,)
        ).fetchone()
        return dict(row) if row else None


def list_campaigns() -> list[dict]:
    with get_conn() as conn:
        rows = conn.execute(
            """SELECT c.*,
                      COUNT(DISTINCT ci.ioc_id)      AS ioc_count,
                      COUNT(DISTINCT ct.technique_id) AS ttp_count
               FROM campaigns c
               LEFT JOIN campaign_iocs ci ON c.id = ci.campaign_id
               LEFT JOIN campaign_ttps  ct ON c.id = ct.campaign_id
               GROUP BY c.id
               ORDER BY c.updated_at DESC"""
        ).fetchall()
        return [dict(r) for r in rows]


def add_ioc_to_campaign(campaign_id: int, ioc_id: int, notes: str = "") -> None:
    with get_conn() as conn:
        conn.execute(
            "INSERT OR IGNORE INTO campaign_iocs (campaign_id, ioc_id, notes) VALUES (?,?,?)",
            (campaign_id, ioc_id, notes),
        )
        conn.execute(
            "UPDATE campaigns SET updated_at = datetime('now') WHERE id = ?",
            (campaign_id,),
        )


def add_ttp_to_campaign(
    campaign_id: int,
    technique_id: str,
    technique_name: str = "",
    tactic: str = "",
    notes: str = "",
) -> None:
    with get_conn() as conn:
        conn.execute(
            """INSERT OR IGNORE INTO campaign_ttps
               (campaign_id, technique_id, technique_name, tactic, notes)
               VALUES (?,?,?,?,?)""",
            (campaign_id, technique_id, technique_name, tactic, notes),
        )
        conn.execute(
            "UPDATE campaigns SET updated_at = datetime('now') WHERE id = ?",
            (campaign_id,),
        )


def get_campaign_iocs(campaign_id: int) -> list[dict]:
    with get_conn() as conn:
        rows = conn.execute(
            """SELECT i.* FROM iocs i
               JOIN campaign_iocs ci ON i.id = ci.ioc_id
               WHERE ci.campaign_id = ?""",
            (campaign_id,),
        ).fetchall()
        return [dict(r) for r in rows]


def get_campaign_ttps(campaign_id: int) -> list[dict]:
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM campaign_ttps WHERE campaign_id = ? ORDER BY tactic, technique_id",
            (campaign_id,),
        ).fetchall()
        return [dict(r) for r in rows]


# ── Reports ───────────────────────────────────────────────────────────────────

def save_report(
    title: str,
    content: str,
    campaign_id: Optional[int] = None,
    report_type: str = "tactical",
    tlp: str = "TLP:WHITE",
) -> int:
    with get_conn() as conn:
        cur = conn.execute(
            "INSERT INTO reports (title, content, campaign_id, report_type, tlp) VALUES (?,?,?,?,?)",
            (title, content, campaign_id, report_type, tlp),
        )
        return cur.lastrowid


def list_reports() -> list[dict]:
    with get_conn() as conn:
        rows = conn.execute(
            """SELECT r.id, r.title, r.report_type, r.tlp, r.created_at,
                      c.name AS campaign_name
               FROM reports r
               LEFT JOIN campaigns c ON r.campaign_id = c.id
               ORDER BY r.created_at DESC"""
        ).fetchall()
        return [dict(r) for r in rows]


def get_report(report_id: int) -> Optional[dict]:
    with get_conn() as conn:
        row = conn.execute(
            "SELECT * FROM reports WHERE id = ?", (report_id,)
        ).fetchone()
        return dict(row) if row else None


# ── Stats ─────────────────────────────────────────────────────────────────────

def get_stats() -> dict:
    with get_conn() as conn:
        ioc_count      = conn.execute("SELECT COUNT(*) FROM iocs").fetchone()[0]
        campaign_count = conn.execute("SELECT COUNT(*) FROM campaigns").fetchone()[0]
        report_count   = conn.execute("SELECT COUNT(*) FROM reports").fetchone()[0]
        watchlist_count = conn.execute("SELECT COUNT(*) FROM watchlist").fetchone()[0]

        type_breakdown = conn.execute(
            "SELECT ioc_type, COUNT(*) AS cnt FROM iocs GROUP BY ioc_type ORDER BY cnt DESC"
        ).fetchall()

        severity_breakdown = conn.execute(
            "SELECT severity, COUNT(*) AS cnt FROM iocs GROUP BY severity ORDER BY cnt DESC"
        ).fetchall()

        top_families = conn.execute(
            """SELECT malware_family, COUNT(*) AS cnt FROM iocs
               WHERE malware_family IS NOT NULL
               GROUP BY malware_family ORDER BY cnt DESC LIMIT 10"""
        ).fetchall()

        source_breakdown = conn.execute(
            "SELECT source, COUNT(*) AS cnt FROM iocs GROUP BY source ORDER BY cnt DESC"
        ).fetchall()

    return {
        "total_iocs":       ioc_count,
        "total_campaigns":  campaign_count,
        "total_reports":    report_count,
        "total_watchlist":  watchlist_count,
        "ioc_types":        [dict(r) for r in type_breakdown],
        "severity_counts":  [dict(r) for r in severity_breakdown],
        "top_families":     [dict(r) for r in top_families],
        "source_counts":    [dict(r) for r in source_breakdown],
    }
