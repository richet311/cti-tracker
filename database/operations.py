"""
Database CRUD operations.

Every function either reads or writes to the SQLite database defined
in models.py. The context manager `get_conn` handles commit/rollback
automatically so callers never have to think about transaction state.
"""

import json
import sqlite3
from contextlib import contextmanager

from config import DB_PATH
from database.models import SCHEMA



def init_db() -> None:
    """Create tables and indexes on first run (idempotent)."""
    with get_conn() as conn:
        conn.executescript(SCHEMA)


@contextmanager
def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()



def upsert_ioc(value: str, ioc_type: str, **kwargs) -> int:
    """
    Insert a new IOC or update an existing one.
    Returns the row id.

    Serialises list/dict kwargs to JSON so they survive SQLite storage.
    """
    if isinstance(kwargs.get("tags"), list):
        kwargs["tags"] = json.dumps(kwargs["tags"])
    if isinstance(kwargs.get("raw_data"), dict):
        kwargs["raw_data"] = json.dumps(kwargs["raw_data"])

    with get_conn() as conn:
        row = conn.execute(
            "SELECT id FROM iocs WHERE value = ?", (value,)
        ).fetchone()

        if row:
            if kwargs:
                sets = ", ".join(f"{k} = ?" for k in kwargs)
                vals = list(kwargs.values()) + [value]
                conn.execute(
                    f"UPDATE iocs SET {sets}, last_seen = datetime('now') WHERE value = ?",
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


def get_ioc(value: str) -> dict | None:
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM iocs WHERE value = ?", (value,)).fetchone()
        return dict(row) if row else None


def list_iocs(ioc_type: str | None = None, limit: int = 50) -> list[dict]:
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


def get_campaign(campaign_id: int) -> dict | None:
    with get_conn() as conn:
        row = conn.execute(
            "SELECT * FROM campaigns WHERE id = ?", (campaign_id,)
        ).fetchone()
        return dict(row) if row else None


def list_campaigns() -> list[dict]:
    with get_conn() as conn:
        rows = conn.execute(
            """
            SELECT c.*,
                   COUNT(DISTINCT ci.ioc_id)       AS ioc_count,
                   COUNT(DISTINCT ct.technique_id)  AS ttp_count
            FROM campaigns c
            LEFT JOIN campaign_iocs ci ON c.id = ci.campaign_id
            LEFT JOIN campaign_ttps ct ON c.id = ct.campaign_id
            GROUP BY c.id
            ORDER BY c.updated_at DESC
            """
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



def save_report(
    title: str,
    content: str,
    campaign_id: int | None = None,
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


def get_report(report_id: int) -> dict | None:
    with get_conn() as conn:
        row = conn.execute(
            "SELECT * FROM reports WHERE id = ?", (report_id,)
        ).fetchone()
        return dict(row) if row else None



def get_stats() -> dict:
    with get_conn() as conn:
        ioc_count      = conn.execute("SELECT COUNT(*) FROM iocs").fetchone()[0]
        campaign_count = conn.execute("SELECT COUNT(*) FROM campaigns").fetchone()[0]
        report_count   = conn.execute("SELECT COUNT(*) FROM reports").fetchone()[0]

        type_breakdown = conn.execute(
            "SELECT ioc_type, COUNT(*) AS cnt FROM iocs GROUP BY ioc_type ORDER BY cnt DESC"
        ).fetchall()

        top_families = conn.execute(
            """SELECT malware_family, COUNT(*) AS cnt FROM iocs
               WHERE malware_family IS NOT NULL
               GROUP BY malware_family ORDER BY cnt DESC LIMIT 10"""
        ).fetchall()

    return {
        "total_iocs":      ioc_count,
        "total_campaigns": campaign_count,
        "total_reports":   report_count,
        "ioc_types":       [dict(r) for r in type_breakdown],
        "top_families":    [dict(r) for r in top_families],
    }
