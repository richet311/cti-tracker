"""
CTI Tracker — FastAPI backend.

Endpoints
---------
Auth
  POST /api/auth/login          Authenticate, receive JWT
  POST /api/auth/register       Create a new user (admin only)
  GET  /api/auth/me             Current user info

IOCs
  GET  /api/iocs                List IOCs (paginated, filterable)
  GET  /api/iocs/search         Full-text + field pivot search
  GET  /api/iocs/{id}           Single IOC detail
  POST /api/iocs/analyze        Enrich and store a single indicator
  POST /api/iocs/{id}/notes     Add analyst note to an IOC
  GET  /api/iocs/{id}/notes     Get notes for an IOC

Watchlist
  GET  /api/watchlist           All watchlisted IOCs
  POST /api/watchlist           Add IOC to watchlist
  DELETE /api/watchlist/{id}    Remove from watchlist

Campaigns
  GET  /api/campaigns           List campaigns
  GET  /api/campaigns/{id}      Campaign detail with IOCs and TTPs

Reports
  GET  /api/reports             List reports
  POST /api/reports/{id}        Generate report for campaign

Export
  GET  /api/export/stix         Export all IOCs as STIX 2.1 bundle (JSON)
  GET  /api/export/csv          Export all IOCs as CSV

Platform
  GET  /api/stats               Dashboard statistics
  GET  /api/audit               Audit log (admin only)
  WS   /ws/collect              Live collection stream (MalwareBazaar + URLhaus + FeodoTracker)

Run with:
  uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
"""

import asyncio
import csv
import io
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from typing import Optional

import database.operations as db
from collectors import malwarebazaar, urlhaus
from collectors import feodotracker
from analyzers.ioc_analyzer import analyze_ioc, detect_ioc_type
from analyzers.scoring import score_confidence, classify_severity
from analyzers.campaign_tracker import get_campaign_summary
from reporters.report_generator import generate_tactical_report
from api.auth import (
    verify_password, create_token, hash_password,
    get_current_user, require_analyst, require_admin,
)
from api.stix_export import build_stix_bundle
from config import REPORTS_DIR

app = FastAPI(title="CTI Tracker API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    db.init_db()


# ── Auth ──────────────────────────────────────────────────────────────────────

@app.post("/api/auth/login")
def login(body: dict):
    username = (body.get("username") or "").strip()
    password = body.get("password") or ""
    if not username or not password:
        raise HTTPException(400, "username and password required")

    user = db.get_user_by_username(username)
    if not user or not verify_password(password, user["password_hash"]):
        raise HTTPException(401, "Invalid credentials")

    db.update_last_login(username)
    db.log_audit(username, "login")
    return {
        "token":    create_token(username, user["role"]),
        "username": username,
        "role":     user["role"],
    }


@app.post("/api/auth/register")
def register(body: dict, user: dict = Depends(require_admin)):
    username = (body.get("username") or "").strip()
    email    = (body.get("email") or "").strip()
    password = body.get("password") or ""
    role     = body.get("role", "analyst")

    if not username or not email or not password:
        raise HTTPException(400, "username, email, and password required")
    if role not in ("admin", "analyst", "viewer"):
        raise HTTPException(400, "role must be admin | analyst | viewer")

    try:
        uid = db.create_user(username, email, password, role)
    except Exception:
        raise HTTPException(409, "Username or email already exists")

    db.log_audit(user["sub"], "register", "user", uid, {"new_user": username, "role": role})
    return {"id": uid, "username": username, "role": role}


@app.get("/api/auth/me")
def me(user: dict = Depends(get_current_user)):
    return {"username": user["sub"], "role": user["role"]}


@app.get("/api/users")
def list_users(user: dict = Depends(require_admin)):
    return db.list_users()


# ── IOCs ──────────────────────────────────────────────────────────────────────

@app.get("/api/iocs")
def list_iocs(
    ioc_type: Optional[str] = None,
    limit:    int           = Query(default=50, le=500),
):
    return db.list_iocs(ioc_type=ioc_type, limit=limit)


@app.get("/api/iocs/search")
def search_iocs(
    q:              Optional[str] = None,
    ioc_type:       Optional[str] = None,
    severity:       Optional[str] = None,
    source:         Optional[str] = None,
    malware_family: Optional[str] = None,
    min_confidence: int           = Query(default=0, ge=0, le=100),
    limit:          int           = Query(default=100, le=500),
):
    """
    Pivot search across all IOC fields.

    Analysts use this to hunt: find all IPs from a specific botnet family,
    all high-severity indicators from a given source, or any IOC matching a
    free-text query across value, family, and threat_type.
    """
    return db.search_iocs(
        q=q,
        ioc_type=ioc_type,
        severity=severity,
        source=source,
        malware_family=malware_family,
        min_confidence=min_confidence,
        limit=limit,
    )


@app.get("/api/iocs/{ioc_id}")
def get_ioc(ioc_id: int):
    ioc = db.get_ioc_by_id(ioc_id)
    if not ioc:
        raise HTTPException(404, "IOC not found")
    ioc["notes"]        = db.get_ioc_notes(ioc_id)
    ioc["on_watchlist"] = db.is_on_watchlist(ioc_id)
    return ioc


@app.post("/api/iocs/analyze")
async def analyze_ioc_endpoint(body: dict, user: dict = Depends(require_analyst)):
    value = (body.get("value") or "").strip()
    if not value:
        raise HTTPException(400, "value is required")

    ioc_type = detect_ioc_type(value)
    loop     = asyncio.get_event_loop()
    result   = await loop.run_in_executor(None, lambda: analyze_ioc(value))

    confidence = score_confidence(
        source="manual",
        malware_family=result.get("malware_family"),
        tags=result.get("tags", []),
    )
    severity = classify_severity(
        ioc_type=ioc_type,
        source="manual",
        malware_family=result.get("malware_family"),
        threat_type=result.get("threat_type"),
        confidence=confidence,
    )

    ioc_id = db.upsert_ioc(
        value=value,
        ioc_type=ioc_type,
        malware_family=result.get("malware_family"),
        threat_type=result.get("threat_type"),
        tags=result.get("tags", []),
        first_seen=result.get("first_seen"),
        last_seen=result.get("last_seen"),
        source=", ".join(result.get("sources", ["manual"])) or "manual",
        confidence=confidence,
        severity=severity,
        raw_data=result.get("raw", {}),
    )
    db.log_audit(user["sub"], "analyze", "ioc", ioc_id, {"value": value})
    return {**result, "confidence": confidence, "severity": severity, "id": ioc_id}


@app.post("/api/iocs/{ioc_id}/notes")
def add_note(ioc_id: int, body: dict, user: dict = Depends(require_analyst)):
    content = (body.get("content") or "").strip()
    if not content:
        raise HTTPException(400, "content is required")
    if not db.get_ioc_by_id(ioc_id):
        raise HTTPException(404, "IOC not found")

    note_id = db.add_ioc_note(ioc_id, author=user["sub"], content=content)
    db.log_audit(user["sub"], "note", "ioc", ioc_id)
    return {"id": note_id, "ioc_id": ioc_id, "author": user["sub"], "content": content}


@app.get("/api/iocs/{ioc_id}/notes")
def get_notes(ioc_id: int):
    if not db.get_ioc_by_id(ioc_id):
        raise HTTPException(404, "IOC not found")
    return db.get_ioc_notes(ioc_id)


# ── Watchlist ─────────────────────────────────────────────────────────────────

@app.get("/api/watchlist")
def get_watchlist():
    return db.get_watchlist()


@app.post("/api/watchlist")
def add_to_watchlist(body: dict, user: dict = Depends(require_analyst)):
    ioc_id   = body.get("ioc_id")
    reason   = (body.get("reason") or "").strip()
    priority = body.get("priority", "medium")

    if not ioc_id:
        raise HTTPException(400, "ioc_id required")
    if not db.get_ioc_by_id(ioc_id):
        raise HTTPException(404, "IOC not found")
    if priority not in ("low", "medium", "high"):
        raise HTTPException(400, "priority must be low | medium | high")

    entry_id = db.add_to_watchlist(ioc_id, added_by=user["sub"], reason=reason, priority=priority)
    db.log_audit(user["sub"], "watchlist", "ioc", ioc_id, {"priority": priority})
    return {"id": entry_id, "ioc_id": ioc_id, "priority": priority}


@app.delete("/api/watchlist/{ioc_id}")
def remove_from_watchlist(ioc_id: int, user: dict = Depends(require_analyst)):
    db.remove_from_watchlist(ioc_id)
    db.log_audit(user["sub"], "watchlist_remove", "ioc", ioc_id)
    return {"removed": True}


# ── Campaigns ─────────────────────────────────────────────────────────────────

@app.get("/api/campaigns")
def list_campaigns():
    return db.list_campaigns()


@app.get("/api/campaigns/{campaign_id}")
def get_campaign(campaign_id: int):
    return get_campaign_summary(campaign_id)


# ── Reports ───────────────────────────────────────────────────────────────────

@app.get("/api/reports")
def list_reports():
    return db.list_reports()


@app.post("/api/reports/{campaign_id}")
def generate_report(
    campaign_id: int,
    tlp: str = "TLP:WHITE",
    user: dict = Depends(require_analyst),
):
    title, content = generate_tactical_report(campaign_id, tlp=tlp)
    if not title:
        raise HTTPException(404, content)

    safe      = "".join(c if c.isalnum() or c in " -_" else "_" for c in title)[:60]
    out_path  = os.path.join(REPORTS_DIR, f"{safe}.md")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(content)

    report_id = db.save_report(title, content, campaign_id=campaign_id, tlp=tlp)
    db.log_audit(user["sub"], "report", "campaign", campaign_id, {"title": title, "tlp": tlp})
    return {"id": report_id, "title": title, "path": out_path}


# ── Export ────────────────────────────────────────────────────────────────────

@app.get("/api/export/stix")
def export_stix(limit: int = Query(default=1000, le=5000)):
    """
    Export all collected IOCs as a STIX 2.1 Bundle (JSON).

    The bundle can be imported into MISP, OpenCTI, CrowdStrike Falcon,
    or any TAXII-compatible threat intelligence platform.
    """
    iocs   = db.list_iocs(limit=limit)
    bundle = build_stix_bundle(iocs)
    return JSONResponse(content=bundle, media_type="application/json")


@app.get("/api/export/csv")
def export_csv(limit: int = Query(default=1000, le=5000)):
    """Export all IOCs as a flat CSV — useful for importing into SIEMs."""
    iocs = db.list_iocs(limit=limit)

    output = io.StringIO()
    writer = csv.DictWriter(
        output,
        fieldnames=[
            "id", "value", "ioc_type", "malware_family", "threat_type",
            "confidence", "severity", "source", "first_seen", "last_seen",
            "tags", "created_at",
        ],
        extrasaction="ignore",
    )
    writer.writeheader()
    writer.writerows(iocs)

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=cti_iocs.csv"},
    )


# ── Stats & Audit ─────────────────────────────────────────────────────────────

@app.get("/api/stats")
def get_stats():
    return db.get_stats()


@app.get("/api/audit")
def get_audit(
    limit: int           = Query(default=100, le=500),
    actor: Optional[str] = None,
    user:  dict          = Depends(require_admin),
):
    return db.get_audit_log(limit=limit, actor=actor)


# ── Live Collection WebSocket ─────────────────────────────────────────────────

@app.websocket("/ws/collect")
async def collect_websocket(websocket: WebSocket, limit: int = 20):
    """
    Stream live IOC collection from three feeds:
      1. MalwareBazaar — recent malware sample hashes (SHA-256)
      2. URLhaus       — recent malicious URLs
      3. FeodoTracker  — active C2 botnet IPs (Emotet, QakBot, TrickBot, Dridex)

    Each collected indicator is auto-scored for confidence and severity before
    being stored. Results stream back as JSON messages in real time.
    """
    await websocket.accept()
    loop = asyncio.get_event_loop()

    async def send(data: dict):
        try:
            await websocket.send_json(data)
        except Exception:
            pass

    total = 0

    try:
        # ── MalwareBazaar ──────────────────────────────────────────────────
        await send({"type": "status", "source": "system",
                    "message": "Connecting to MalwareBazaar..."})

        samples = await loop.run_in_executor(
            None, lambda: malwarebazaar.get_recent_samples(limit)
        )
        await send({"type": "status", "source": "malwarebazaar",
                    "message": f"Fetched {len(samples)} samples"})

        for s in samples:
            conf = score_confidence("malwarebazaar", s.get("signature"), s.get("tags") or [])
            sev  = classify_severity("hash_sha256", "malwarebazaar",
                                     s.get("signature"), s.get("file_type"), conf)
            db.upsert_ioc(
                value=s.get("sha256_hash", ""),
                ioc_type="hash_sha256",
                malware_family=s.get("signature"),
                threat_type=s.get("file_type"),
                first_seen=s.get("first_seen"),
                last_seen=s.get("last_seen"),
                tags=s.get("tags") or [],
                source="malwarebazaar",
                confidence=conf,
                severity=sev,
                raw_data=s,
            )
            await send({
                "type": "ioc", "source": "malwarebazaar",
                "value": s.get("sha256_hash", ""), "ioc_type": "hash_sha256",
                "malware_family": s.get("signature"), "threat_type": s.get("file_type"),
                "confidence": conf, "severity": sev, "first_seen": s.get("first_seen"),
            })
            total += 1
            await asyncio.sleep(0.07)

        # ── URLhaus ────────────────────────────────────────────────────────
        await send({"type": "status", "source": "system",
                    "message": "Connecting to URLhaus..."})

        urls_data = await loop.run_in_executor(
            None, lambda: urlhaus.get_recent_urls(limit)
        )
        await send({"type": "status", "source": "urlhaus",
                    "message": f"Fetched {len(urls_data)} malicious URLs"})

        for u in urls_data:
            conf = score_confidence("urlhaus", None, u.get("tags") or [])
            sev  = classify_severity("url", "urlhaus", None, u.get("threat"), conf)
            db.upsert_ioc(
                value=u.get("url", ""),
                ioc_type="url",
                threat_type=u.get("threat"),
                tags=u.get("tags") or [],
                first_seen=u.get("date_added"),
                source="urlhaus",
                confidence=conf,
                severity=sev,
                raw_data=u,
            )
            await send({
                "type": "ioc", "source": "urlhaus",
                "value": u.get("url", ""), "ioc_type": "url",
                "threat_type": u.get("threat"),
                "confidence": conf, "severity": sev,
                "first_seen": u.get("date_added"),
            })
            total += 1
            await asyncio.sleep(0.07)

        # ── FeodoTracker ───────────────────────────────────────────────────
        await send({"type": "status", "source": "system",
                    "message": "Connecting to FeodoTracker (C2 IPs)..."})

        c2_ips = await loop.run_in_executor(
            None, lambda: feodotracker.get_c2_ips(limit)
        )
        await send({"type": "status", "source": "feodotracker",
                    "message": f"Fetched {len(c2_ips)} C2 botnet IPs"})

        for c in c2_ips:
            conf = score_confidence("feodotracker", c.get("malware_family"), [])
            sev  = classify_severity("ip", "feodotracker",
                                     c.get("malware_family"), None, conf)
            db.upsert_ioc(
                value=c.get("ip", ""),
                ioc_type="ip",
                malware_family=c.get("malware_family"),
                threat_type="c2",
                first_seen=c.get("first_seen"),
                last_seen=c.get("last_online"),
                tags=["c2", "botnet"],
                source="feodotracker",
                confidence=conf,
                severity=sev,
                raw_data=c,
            )
            await send({
                "type": "ioc", "source": "feodotracker",
                "value": c.get("ip", ""), "ioc_type": "ip",
                "malware_family": c.get("malware_family"), "threat_type": "c2",
                "confidence": conf, "severity": sev,
                "first_seen": c.get("first_seen"),
            })
            total += 1
            await asyncio.sleep(0.05)

        db.log_audit("system", "collect", details={"total": total})
        await send({
            "type": "complete", "source": "system", "total": total,
            "message": f"Collection complete — {total} indicators stored",
        })

    except WebSocketDisconnect:
        pass
