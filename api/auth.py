"""
JWT authentication for CTI Tracker.

Three roles map to real CTI platform access patterns:

  admin    — full access: register users, view audit logs, all write ops
  analyst  — can collect, enrich, write notes, manage watchlist, generate reports
  viewer   — read-only: can see IOCs, campaigns, reports but cannot write

On first startup, init_db() seeds a default admin account:
  username: admin   password: changeme
Change the password via POST /api/auth/password after first login.
"""

import hashlib
import hmac
import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt

SECRET_KEY = os.getenv("CTI_SECRET_KEY", "cti-tracker-dev-secret-change-in-production")
ALGORITHM  = "HS256"
TOKEN_TTL  = 60 * 8  # 8-hour sessions

_bearer = HTTPBearer(auto_error=False)

_ITERATIONS = 260_000
_HASH       = "sha256"


def hash_password(plain: str) -> str:
    """PBKDF2-SHA256 with a random 16-byte salt. Same algorithm as Django."""
    salt = secrets.token_hex(16)
    dk   = hashlib.pbkdf2_hmac(_HASH, plain.encode(), salt.encode(), _ITERATIONS)
    return f"pbkdf2:{_HASH}:{_ITERATIONS}:{salt}:{dk.hex()}"


def verify_password(plain: str, stored: str) -> bool:
    """Constant-time comparison against stored PBKDF2 hash."""
    try:
        _, alg, iters, salt, stored_dk = stored.split(":")
        dk = hashlib.pbkdf2_hmac(alg, plain.encode(), salt.encode(), int(iters))
        return hmac.compare_digest(dk.hex(), stored_dk)
    except Exception:
        return False


def create_token(username: str, role: str) -> str:
    payload = {
        "sub":  username,
        "role": role,
        "exp":  datetime.now(timezone.utc) + timedelta(minutes=TOKEN_TTL),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def _decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalid or expired",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_user(
    creds: Optional[HTTPAuthorizationCredentials] = Depends(_bearer),
) -> dict:
    if not creds:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return _decode_token(creds.credentials)


def require_analyst(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") not in ("analyst", "admin"):
        raise HTTPException(status_code=403, detail="Analyst role required")
    return user


def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin role required")
    return user
