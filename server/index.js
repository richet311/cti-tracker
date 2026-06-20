require("dotenv").config();

const http      = require("http");
const express   = require("express");
const cors      = require("cors");
const rateLimit = require("express-rate-limit");
const WebSocket = require("ws");
const crypto    = require("crypto");

const db = require("./db");
const {
  verifyPassword, hashPassword, createToken, decodeToken,
  authMiddleware, requireAnalyst, requireAdmin,
} = require("./auth");
const { detectIocType, analyzeIoc }  = require("./analyzers/ioc");
const { scoreConfidence, classifySeverity } = require("./analyzers/scoring");
const { getCampaignSummary }         = require("./analyzers/campaign");
const { generateTacticalReport, saveReportFile } = require("./reports");
const { buildStixBundle }            = require("./stix");
const { getRecentSamples }           = require("./collectors/malwarebazaar");
const { getRecentUrls }              = require("./collectors/urlhaus");
const { getC2Ips }                   = require("./collectors/feodotracker");

const app = express();
app.use(cors({ origin: ["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"], credentials: true }));
app.use(express.json());

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { detail: "Too many login attempts — try again in 15 minutes" },
});

// ── Auth ──────────────────────────────────────────────────────────────────────

app.post("/api/auth/login", loginLimiter, async (req, res) => {
  try {
    const username = (req.body.username || "").trim();
    const password = req.body.password || "";
    if (!username || !password)
      return res.status(400).json({ detail: "username and password required" });

    const user = await db.getUserByUsername(username);
    if (!user || !verifyPassword(password, user.password_hash))
      return res.status(401).json({ detail: "Invalid credentials" });

    await db.updateLastLogin(username);
    await db.logAudit(username, "login");
    res.json({ access_token: createToken(username, user.role), username, role: user.role });
  } catch (e) {
    res.status(500).json({ detail: e.message });
  }
});

app.post("/api/auth/register", requireAdmin, async (req, res) => {
  try {
    const username = (req.body.username || "").trim();
    const email    = (req.body.email    || "").trim();
    const password = req.body.password  || "";
    const role     = req.body.role      || "analyst";

    if (!username || !email || !password)
      return res.status(400).json({ detail: "username, email, and password required" });
    if (!["admin", "analyst", "viewer"].includes(role))
      return res.status(400).json({ detail: "role must be admin | analyst | viewer" });

    const uid = await db.createUser(username, email, password, role);
    await db.logAudit(req.user.sub, "register", "user", uid, { new_user: username, role });
    res.json({ id: uid, username, role });
  } catch {
    res.status(409).json({ detail: "Username or email already exists" });
  }
});

app.get("/api/auth/me", authMiddleware, (req, res) => {
  res.json({ username: req.user.sub, role: req.user.role });
});

app.post("/api/auth/signup", loginLimiter, async (req, res) => {
  try {
    const username = (req.body.username || "").trim();
    const email    = (req.body.email    || "").trim();
    const password = req.body.password  || "";

    if (!username || !email || !password)
      return res.status(400).json({ detail: "username, email, and password required" });
    if (username.length < 3)
      return res.status(400).json({ detail: "Username must be at least 3 characters" });
    if (password.length < 8)
      return res.status(400).json({ detail: "Password must be at least 8 characters" });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({ detail: "Invalid email address" });

    await db.createUser(username, email, password, "analyst");
    const token = createToken(username, "analyst");
    await db.logAudit(username, "signup");
    res.json({ access_token: token, username, role: "analyst" });
  } catch {
    res.status(409).json({ detail: "Username or email is already taken" });
  }
});

app.post("/api/auth/google-signin", loginLimiter, async (req, res) => {
  try {
    const email = (req.body.email || "").trim().toLowerCase();
    const name  = (req.body.name  || "").trim();
    if (!email) return res.status(400).json({ detail: "email required" });

    let user = await db.getUserByEmail(email);
    if (!user) {
      const base     = (name || email.split("@")[0]).replace(/[^a-zA-Z0-9_]/g, "_").toLowerCase().slice(0, 18);
      const username = `${base}_${crypto.randomBytes(3).toString("hex")}`;
      await db.createUser(username, email, crypto.randomBytes(32).toString("hex"), "analyst");
      user = await db.getUserByEmail(email);
    }

    await db.updateLastLogin(user.username);
    res.json({ access_token: createToken(user.username, user.role), username: user.username, role: user.role });
  } catch (e) {
    res.status(500).json({ detail: e.message });
  }
});

app.patch("/api/auth/password", authMiddleware, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password)
      return res.status(400).json({ detail: "current_password and new_password required" });
    if (new_password.length < 8)
      return res.status(400).json({ detail: "Password must be at least 8 characters" });

    const user = await db.getUserByUsername(req.user.sub);
    if (!user) return res.status(404).json({ detail: "User not found" });
    if (!verifyPassword(current_password, user.password_hash))
      return res.status(401).json({ detail: "Current password is incorrect" });

    await db.updatePassword(user.username, hashPassword(new_password));
    await db.logAudit(user.username, "password_change");
    res.json({ message: "Password updated" });
  } catch (e) {
    res.status(500).json({ detail: e.message });
  }
});

app.get("/api/users", requireAdmin, async (_req, res) => {
  try {
    res.json(await db.listUsers());
  } catch (e) {
    res.status(500).json({ detail: e.message });
  }
});

// ── IOCs ──────────────────────────────────────────────────────────────────────

app.get("/api/iocs", async (req, res) => {
  try {
    const limit    = Math.min(parseInt(req.query.limit) || 50, 500);
    const ioc_type = req.query.ioc_type || null;
    res.json(await db.listIocs(ioc_type, limit));
  } catch (e) {
    res.status(500).json({ detail: e.message });
  }
});

app.get("/api/iocs/search", async (req, res) => {
  try {
    const { q, ioc_type, severity, source, malware_family, min_confidence, limit } = req.query;
    res.json(await db.searchIocs({
      q:              q || null,
      ioc_type:       ioc_type || null,
      severity:       severity || null,
      source:         source || null,
      malware_family: malware_family || null,
      min_confidence: parseInt(min_confidence) || 0,
      limit:          Math.min(parseInt(limit) || 100, 500),
    }));
  } catch (e) {
    res.status(500).json({ detail: e.message });
  }
});

app.get("/api/iocs/:id", async (req, res) => {
  try {
    const ioc = await db.getIocById(parseInt(req.params.id));
    if (!ioc) return res.status(404).json({ detail: "IOC not found" });
    ioc.notes        = await db.getIocNotes(ioc.id);
    ioc.on_watchlist = await db.isOnWatchlist(ioc.id);
    res.json(ioc);
  } catch (e) {
    res.status(500).json({ detail: e.message });
  }
});

app.post("/api/iocs/analyze", requireAnalyst, async (req, res) => {
  try {
    const value = (req.body.value || "").trim();
    if (!value) return res.status(400).json({ detail: "value is required" });

    const iocType  = detectIocType(value);
    const result   = await analyzeIoc(value);
    const conf     = scoreConfidence("manual", result.malware_family, result.tags);
    const severity = classifySeverity(iocType, "manual", result.malware_family, result.threat_type, conf);

    const iocId = await db.upsertIoc(value, iocType, {
      malware_family: result.malware_family,
      threat_type:    result.threat_type,
      tags:           result.tags,
      first_seen:     result.first_seen,
      last_seen:      result.last_seen,
      source:         result.sources.join(", ") || "manual",
      confidence:     conf,
      severity,
      raw_data:       result.raw,
    });

    await db.logAudit(req.user.sub, "analyze", "ioc", iocId, { value });
    res.json({ ...result, confidence: conf, severity, id: iocId });
  } catch (e) {
    res.status(500).json({ detail: e.message });
  }
});

app.post("/api/iocs/:id/notes", requireAnalyst, async (req, res) => {
  try {
    const iocId   = parseInt(req.params.id);
    const content = (req.body.content || "").trim();
    if (!content) return res.status(400).json({ detail: "content is required" });
    if (!await db.getIocById(iocId)) return res.status(404).json({ detail: "IOC not found" });

    const noteId = await db.addIocNote(iocId, req.user.sub, content);
    await db.logAudit(req.user.sub, "note", "ioc", iocId);
    res.json({ id: noteId, ioc_id: iocId, author: req.user.sub, content });
  } catch (e) {
    res.status(500).json({ detail: e.message });
  }
});

app.get("/api/iocs/:id/notes", async (req, res) => {
  try {
    const iocId = parseInt(req.params.id);
    if (!await db.getIocById(iocId)) return res.status(404).json({ detail: "IOC not found" });
    res.json(await db.getIocNotes(iocId));
  } catch (e) {
    res.status(500).json({ detail: e.message });
  }
});

// ── Watchlist ─────────────────────────────────────────────────────────────────

app.get("/api/watchlist", async (_req, res) => {
  try {
    res.json(await db.getWatchlist());
  } catch (e) {
    res.status(500).json({ detail: e.message });
  }
});

app.post("/api/watchlist", requireAnalyst, async (req, res) => {
  try {
    const { ioc_id, reason = "", priority = "medium" } = req.body;
    if (!ioc_id) return res.status(400).json({ detail: "ioc_id required" });
    if (!await db.getIocById(ioc_id)) return res.status(404).json({ detail: "IOC not found" });
    if (!["low", "medium", "high"].includes(priority))
      return res.status(400).json({ detail: "priority must be low | medium | high" });

    const entryId = await db.addToWatchlist(ioc_id, req.user.sub, reason, priority);
    await db.logAudit(req.user.sub, "watchlist", "ioc", ioc_id, { priority });
    res.json({ id: entryId, ioc_id, priority });
  } catch (e) {
    res.status(500).json({ detail: e.message });
  }
});

app.delete("/api/watchlist/:id", requireAnalyst, async (req, res) => {
  try {
    await db.removeFromWatchlist(parseInt(req.params.id));
    await db.logAudit(req.user.sub, "watchlist_remove", "ioc", parseInt(req.params.id));
    res.json({ removed: true });
  } catch (e) {
    res.status(500).json({ detail: e.message });
  }
});

// ── Campaigns ─────────────────────────────────────────────────────────────────

app.get("/api/campaigns", async (_req, res) => {
  try {
    res.json(await db.listCampaigns());
  } catch (e) {
    res.status(500).json({ detail: e.message });
  }
});

app.get("/api/campaigns/:id", async (req, res) => {
  try {
    const summary = await getCampaignSummary(parseInt(req.params.id));
    if (!summary) return res.status(404).json({ detail: "Campaign not found" });
    res.json(summary);
  } catch (e) {
    res.status(500).json({ detail: e.message });
  }
});

// ── Reports ───────────────────────────────────────────────────────────────────

app.get("/api/reports", async (_req, res) => {
  try {
    res.json(await db.listReports());
  } catch (e) {
    res.status(500).json({ detail: e.message });
  }
});

app.post("/api/reports/:id", requireAnalyst, async (req, res) => {
  try {
    const campaignId = parseInt(req.params.id);
    const tlp        = req.query.tlp || "TLP:WHITE";
    const [title, content] = await generateTacticalReport(campaignId, tlp);

    if (!title) return res.status(404).json({ detail: content });

    const outPath  = saveReportFile(title, content);
    const reportId = await db.saveReport(title, content, campaignId, "tactical", tlp);
    await db.logAudit(req.user.sub, "report", "campaign", campaignId, { title, tlp });
    res.json({ id: reportId, title, path: outPath });
  } catch (e) {
    res.status(500).json({ detail: e.message });
  }
});

// ── Export ────────────────────────────────────────────────────────────────────

app.get("/api/export/stix", async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 1000, 5000);
    const iocs  = await db.listIocs(null, limit);
    res.json(buildStixBundle(iocs));
  } catch (e) {
    res.status(500).json({ detail: e.message });
  }
});

app.get("/api/export/csv", async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 1000, 5000);
    const iocs  = await db.listIocs(null, limit);
    const fields = ["id", "value", "ioc_type", "malware_family", "threat_type",
                    "confidence", "severity", "source", "first_seen", "last_seen",
                    "tags", "created_at"];

    const rows = [
      fields.join(","),
      ...iocs.map((ioc) =>
        fields.map((f) => {
          const v = ioc[f] ?? "";
          const str = Array.isArray(v) ? JSON.stringify(v) : String(v);
          return `"${str.replace(/"/g, '""')}"`;
        }).join(",")
      ),
    ];

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=cti_iocs.csv");
    res.send(rows.join("\n"));
  } catch (e) {
    res.status(500).json({ detail: e.message });
  }
});

// ── Stats & Audit ─────────────────────────────────────────────────────────────

app.get("/api/stats", async (_req, res) => {
  try {
    res.json(await db.getStats());
  } catch (e) {
    res.status(500).json({ detail: e.message });
  }
});

app.get("/api/audit", requireAdmin, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 100, 500);
    const actor = req.query.actor || null;
    res.json(await db.getAuditLog(limit, actor));
  } catch (e) {
    res.status(500).json({ detail: e.message });
  }
});

// ── HTTP + WebSocket server ───────────────────────────────────────────────────

const server = http.createServer(app);
const wss    = new WebSocket.Server({ noServer: true });

server.on("upgrade", (request, socket, head) => {
  const url = (request.url || "").split("?")[0];
  if (url !== "/ws/collect") { socket.destroy(); return; }
  wss.handleUpgrade(request, socket, head, (ws) => wss.emit("connection", ws, request));
});

wss.on("connection", async (ws, req) => {
  const params = new URLSearchParams((req.url || "").split("?")[1] || "");
  const limit  = Math.min(parseInt(params.get("limit") || "20"), 200);

  function send(data) {
    if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(data));
  }

  let total = 0;

  try {
    send({ type: "status", source: "system", message: "Connecting to MalwareBazaar..." });
    const samples = await getRecentSamples(limit);
    send({ type: "status", source: "malwarebazaar", message: `Fetched ${samples.length} samples` });

    for (const s of samples) {
      if (ws.readyState !== WebSocket.OPEN) return;
      const conf = scoreConfidence("malwarebazaar", s.signature, s.tags || []);
      const sev  = classifySeverity("hash_sha256", "malwarebazaar", s.signature, s.file_type, conf);
      await db.upsertIoc(s.sha256_hash, "hash_sha256", {
        malware_family: s.signature,
        threat_type:    s.file_type,
        first_seen:     s.first_seen,
        last_seen:      s.last_seen,
        tags:           s.tags || [],
        source:         "malwarebazaar",
        confidence:     conf,
        severity:       sev,
        raw_data:       s,
      });
      send({ type: "ioc", source: "malwarebazaar", value: s.sha256_hash, ioc_type: "hash_sha256",
             malware_family: s.signature, threat_type: s.file_type, confidence: conf, severity: sev,
             first_seen: s.first_seen });
      total++;
      await sleep(70);
    }

    send({ type: "status", source: "system", message: "Connecting to URLhaus..." });
    const urls = await getRecentUrls(limit);
    send({ type: "status", source: "urlhaus", message: `Fetched ${urls.length} malicious URLs` });

    for (const u of urls) {
      if (ws.readyState !== WebSocket.OPEN) return;
      const conf = scoreConfidence("urlhaus", null, u.tags || []);
      const sev  = classifySeverity("url", "urlhaus", null, u.threat, conf);
      await db.upsertIoc(u.url, "url", {
        threat_type: u.threat,
        tags:        u.tags || [],
        first_seen:  u.date_added,
        source:      "urlhaus",
        confidence:  conf,
        severity:    sev,
        raw_data:    u,
      });
      send({ type: "ioc", source: "urlhaus", value: u.url, ioc_type: "url",
             threat_type: u.threat, confidence: conf, severity: sev, first_seen: u.date_added });
      total++;
      await sleep(70);
    }

    send({ type: "status", source: "system", message: "Connecting to FeodoTracker (C2 IPs)..." });
    const c2Ips = await getC2Ips(limit);
    send({ type: "status", source: "feodotracker", message: `Fetched ${c2Ips.length} C2 botnet IPs` });

    for (const c of c2Ips) {
      if (ws.readyState !== WebSocket.OPEN) return;
      const conf = scoreConfidence("feodotracker", c.malware_family, []);
      const sev  = classifySeverity("ip", "feodotracker", c.malware_family, null, conf);
      await db.upsertIoc(c.ip, "ip", {
        malware_family: c.malware_family,
        threat_type:    "c2",
        first_seen:     c.first_seen,
        last_seen:      c.last_online,
        tags:           ["c2", "botnet"],
        source:         "feodotracker",
        confidence:     conf,
        severity:       sev,
        raw_data:       c,
      });
      send({ type: "ioc", source: "feodotracker", value: c.ip, ioc_type: "ip",
             malware_family: c.malware_family, threat_type: "c2", confidence: conf, severity: sev,
             first_seen: c.first_seen });
      total++;
      await sleep(50);
    }

    await db.logAudit("system", "collect", null, null, { total });
    send({ type: "complete", source: "system", total, message: `Collection complete — ${total} indicators stored` });
  } catch (e) {
    if (ws.readyState === WebSocket.OPEN) {
      send({ type: "error", source: "system", message: e.message });
    }
  }
});

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Start ─────────────────────────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT || "8000");

db.initDb()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`CTI Tracker server running on http://0.0.0.0:${PORT}`);
      console.log(`WebSocket available at ws://localhost:${PORT}/ws/collect`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize database:", err.message);
    process.exit(1);
  });
