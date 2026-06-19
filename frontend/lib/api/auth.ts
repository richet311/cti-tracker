import { BASE } from "./constants";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("cti-token");
}

export function setToken(token: string) {
  localStorage.setItem("cti-token", token);
}

export function clearToken() {
  localStorage.removeItem("cti-token");
}

export function authHeaders(): HeadersInit {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function login(
  username: string,
  password: string,
): Promise<{ access_token: string; role: string; username: string }> {
  const r = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!r.ok) {
    const data = await r.json().catch(() => ({}));
    throw new Error(data.detail ?? "Login failed");
  }
  return r.json();
}

export async function fetchMe(): Promise<{ username: string; role: string }> {
  const r = await fetch(`${BASE}/api/auth/me`, { headers: authHeaders() });
  if (!r.ok) throw new Error("Unauthorized");
  return r.json();
}
