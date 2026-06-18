"""
CTI Tracker — FastAPI backend.

Wraps the existing collectors/analyzers/database modules into REST endpoints
and a WebSocket that streams live IOC collection to the dashboard.

Run with:
  uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
"""

import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional

import database.operations as db
from collectors import malwarebazaar, urlhaus
from analyzers.ioc_analyzer import analyze_ioc, detect_ioc_type
from analyzers.campaign_tracker import get_campaign_summary
from reporters.report_generator import generate_tactical_report
from config import REPORTS_DIR

app = FastAPI(title="CTI Tracker API", version="1.0.0")

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



@app.get("/api/stats")
def get_stats():
    return db.get_stats()



@app.get("/api/iocs")
def list_iocs(ioc_type: Optional[str] = None, limit: int = 50):
    return db.list_iocs(ioc_type=ioc_type, limit=limit)


@app.post("/api/iocs/analyze")
async def analyze_ioc_endpoint(body: dict):
    value = body.get("value", "").strip()
    if not value:
        return {"error": "value is required"}

    ioc_type = detect_ioc_type(value)
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, lambda: analyze_ioc(value))

    db.upsert_ioc(
        value=value,
        ioc_type=ioc_type,
        malware_family=result.get("malware_family"),
        threat_type=result.get("threat_type"),
        tags=result.get("tags", []),
        first_seen=result.get("first_seen"),
        last_seen=result.get("last_seen"),
        source=", ".join(result.get("sources", ["manual"])) or "manual",
        raw_data=result.get("raw", {}),
    )
    return result



@app.get("/api/campaigns")
def list_campaigns():
    return db.list_campaigns()


@app.get("/api/campaigns/{campaign_id}")
def get_campaign(campaign_id: int):
    return get_campaign_summary(campaign_id)



@app.get("/api/reports")
def list_reports():
    return db.list_reports()


@app.post("/api/reports/{campaign_id}")
def generate_report(campaign_id: int, tlp: str = "TLP:WHITE"):
    title, content = generate_tactical_report(campaign_id, tlp=tlp)
    if not title:
        return {"error": content}
    safe = "".join(c if c.isalnum() or c in " -_" else "_" for c in title)[:60]
    out_path = os.path.join(REPORTS_DIR, f"{safe}.md")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(content)
    report_id = db.save_report(title, content, campaign_id=campaign_id, tlp=tlp)
    return {"id": report_id, "title": title, "path": out_path}



@app.websocket("/ws/collect")
async def collect_websocket(websocket: WebSocket, limit: int = 20):
    await websocket.accept()
    loop = asyncio.get_event_loop()

    async def send(data: dict):
        try:
            await websocket.send_json(data)
        except Exception:
            pass

    try:
        await send({
            "type": "status",
            "source": "system",
            "message": "Connecting to MalwareBazaar...",
        })

        samples = await loop.run_in_executor(
            None, lambda: malwarebazaar.get_recent_samples(limit)
        )

        await send({
            "type": "status",
            "source": "malwarebazaar",
            "message": f"Fetched {len(samples)} samples",
        })

        for s in samples:
            db.upsert_ioc(
                value=s.get("sha256_hash", ""),
                ioc_type="hash_sha256",
                malware_family=s.get("signature"),
                threat_type=s.get("file_type"),
                first_seen=s.get("first_seen"),
                last_seen=s.get("last_seen"),
                tags=s.get("tags") or [],
                source="malwarebazaar",
                raw_data=s,
            )
            await send({
                "type": "ioc",
                "source": "malwarebazaar",
                "value": s.get("sha256_hash", ""),
                "ioc_type": "hash_sha256",
                "malware_family": s.get("signature"),
                "threat_type": s.get("file_type"),
                "first_seen": s.get("first_seen"),
            })
            await asyncio.sleep(0.07)

        await send({
            "type": "status",
            "source": "system",
            "message": "Connecting to URLhaus...",
        })

        urls_data = await loop.run_in_executor(
            None, lambda: urlhaus.get_recent_urls(limit)
        )

        await send({
            "type": "status",
            "source": "urlhaus",
            "message": f"Fetched {len(urls_data)} malicious URLs",
        })

        for u in urls_data:
            db.upsert_ioc(
                value=u.get("url", ""),
                ioc_type="url",
                threat_type=u.get("threat"),
                tags=u.get("tags") or [],
                first_seen=u.get("date_added"),
                source="urlhaus",
                raw_data=u,
            )
            await send({
                "type": "ioc",
                "source": "urlhaus",
                "value": u.get("url", ""),
                "ioc_type": "url",
                "threat_type": u.get("threat"),
                "first_seen": u.get("date_added"),
            })
            await asyncio.sleep(0.07)

        await send({
            "type": "complete",
            "source": "system",
            "message": f"Collection complete — {len(samples) + len(urls_data)} indicators stored",
            "total": len(samples) + len(urls_data),
        })

    except WebSocketDisconnect:
        pass
