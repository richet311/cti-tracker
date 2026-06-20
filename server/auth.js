const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const SECRET_KEY = process.env.CTI_SECRET_KEY || "cti-tracker-dev-secret-change-in-production";
const TOKEN_TTL_SECONDS = 60 * 60 * 8; // 8 hours

const ITERATIONS = 260_000;

function hashPassword(plain) {
  const salt = crypto.randomBytes(16).toString("hex");
  const dk = crypto.pbkdf2Sync(plain, salt, ITERATIONS, 32, "sha256");
  return `pbkdf2:sha256:${ITERATIONS}:${salt}:${dk.toString("hex")}`;
}

function verifyPassword(plain, stored) {
  try {
    const [, alg, iters, salt, storedDk] = stored.split(":");
    const dk = crypto.pbkdf2Sync(plain, salt, parseInt(iters), 32, alg);
    return crypto.timingSafeEqual(
      Buffer.from(dk.toString("hex")),
      Buffer.from(storedDk)
    );
  } catch {
    return false;
  }
}

function createToken(username, role) {
  return jwt.sign({ sub: username, role }, SECRET_KEY, {
    algorithm: "HS256",
    expiresIn: TOKEN_TTL_SECONDS,
  });
}

function decodeToken(token) {
  return jwt.verify(token, SECRET_KEY, { algorithms: ["HS256"] });
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ detail: "Authentication required" });
  }
  try {
    req.user = decodeToken(header.slice(7));
    next();
  } catch {
    res.status(401).json({ detail: "Token invalid or expired" });
  }
}

function requireAnalyst(req, res, next) {
  authMiddleware(req, res, () => {
    if (!["analyst", "admin"].includes(req.user?.role)) {
      return res.status(403).json({ detail: "Analyst role required" });
    }
    next();
  });
}

function requireAdmin(req, res, next) {
  authMiddleware(req, res, () => {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ detail: "Admin role required" });
    }
    next();
  });
}

module.exports = {
  hashPassword,
  verifyPassword,
  createToken,
  decodeToken,
  authMiddleware,
  requireAnalyst,
  requireAdmin,
};
