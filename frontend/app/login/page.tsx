"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ShieldCheckIcon as ShieldCheck,
  EyeIcon as Eye,
  EyeSlashIcon as EyeSlash,
  ArrowRightIcon as ArrowRight,
} from "@phosphor-icons/react";
import { login, setToken, getToken } from "@/lib/api";
import { BrandMark } from "@/components/shared/BrandMark";

const ACCENT = "#60a5fa";

const ROLE_DESCRIPTIONS: Record<string, string> = {
  admin:   "Full access: register users, view audit logs, all write operations",
  analyst: "Can collect, annotate IOCs, manage watchlist, generate reports",
  viewer:  "Read-only access to IOCs, campaigns, and reports",
};

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState<{ role: string; username: string } | null>(null);

  useEffect(() => {
    if (getToken()) router.replace("/dashboard");
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password) return;
    setLoading(true);
    setError("");
    try {
      const data = await login(username.trim(), password);
      setToken(data.access_token);
      setSuccess({ role: data.role, username: data.username });
      setTimeout(() => router.push("/dashboard"), 900);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: "#09090b" }}
    >
      {/* dot grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden
        style={{
          backgroundImage: "radial-gradient(circle, rgba(96,165,250,0.04) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      {/* ambient glow */}
      <div
        className="absolute pointer-events-none"
        aria-hidden
        style={{
          top: "-20%", left: "50%", transform: "translateX(-50%)",
          width: 700, height: 500,
          background: `radial-gradient(ellipse at 50% 40%, ${ACCENT}12 0%, transparent 65%)`,
          filter: "blur(48px)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm relative z-10"
      >
        {/* Card */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: "#111114",
            border: "1px solid #27272a",
            borderTop: `1px solid ${ACCENT}25`,
            boxShadow: `0 40px 80px rgba(0,0,0,0.7), 0 0 0 1px #1a1a1f`,
          }}
        >
          {/* Header */}
          <div className="px-8 pt-8 pb-6 text-center" style={{ borderBottom: "1px solid #1e1e22" }}>
            <div className="flex justify-center mb-4">
              <BrandMark size={40} color={ACCENT} />
            </div>
            <div className="font-bold text-lg tracking-tight mb-1">
              <span className="text-zinc-100">CTI</span>
              <span style={{ color: ACCENT }}>Tracker</span>
            </div>
            <p className="text-zinc-500 text-xs">Sign in to your analyst account</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4">
            {/* Success state */}
            {success && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-lg p-3 text-center"
                style={{ background: "#16a34a18", border: "1px solid #22c55e30" }}
              >
                <ShieldCheck className="w-5 h-5 mx-auto mb-1" style={{ color: "#22c55e" }} weight="fill" />
                <p className="text-xs font-semibold text-emerald-400">
                  Welcome, {success.username}
                </p>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  {ROLE_DESCRIPTIONS[success.role] ?? success.role}
                </p>
                <p className="text-[10px] text-zinc-600 mt-1">Redirecting to dashboard...</p>
              </motion.div>
            )}

            {!success && (
              <>
                {/* Username */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                    Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="analyst"
                    autoComplete="username"
                    className="w-full px-3 py-2.5 rounded-lg text-sm bg-zinc-900/80 border border-zinc-800 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 transition-colors"
                    disabled={loading}
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className="w-full px-3 py-2.5 pr-10 rounded-lg text-sm bg-zinc-900/80 border border-zinc-800 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 transition-colors"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                      aria-label={showPw ? "Hide password" : "Show password"}
                      tabIndex={-1}
                    >
                      {showPw
                        ? <EyeSlash className="w-4 h-4" />
                        : <Eye className="w-4 h-4" />
                      }
                    </button>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-red-400 text-center px-2 py-2 rounded-lg"
                    style={{ background: "#ef444415", border: "1px solid #ef444425" }}
                  >
                    {error}
                  </motion.p>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading || !username.trim() || !password}
                  className="w-full py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all mt-2"
                  style={{
                    background: loading || !username.trim() || !password
                      ? "#27272a"
                      : ACCENT,
                    color: loading || !username.trim() || !password
                      ? "#52525b"
                      : "#09090b",
                    cursor: loading || !username.trim() || !password
                      ? "not-allowed"
                      : "pointer",
                  }}
                >
                  <ShieldCheck className="w-4 h-4" weight="bold" />
                  {loading ? "Signing in…" : "Sign in"}
                </button>

                {/* Default creds hint */}
                <div
                  className="rounded-lg px-3 py-2.5 mt-1"
                  style={{ background: "#18181b", border: "1px solid #27272a" }}
                >
                  <p className="text-[10px] text-zinc-600 text-center mb-1.5">
                    Default credentials (first run)
                  </p>
                  <div className="flex justify-center gap-6">
                    <div className="text-center">
                      <p className="text-[10px] text-zinc-500 mb-0.5">Username</p>
                      <p className="text-xs font-mono font-bold text-zinc-300">admin</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-zinc-500 mb-0.5">Password</p>
                      <p className="text-xs font-mono font-bold text-zinc-300">changeme</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </form>
        </div>

        {/* Footer links */}
        <div className="flex items-center justify-between mt-4 px-1">
          <Link
            href="/"
            className="text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            ← Back to home
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center gap-1 text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            Skip to dashboard <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
