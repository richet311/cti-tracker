"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheckIcon as ShieldCheck,
  EyeIcon as Eye,
  EyeSlashIcon as EyeSlash,
  ArrowRightIcon as ArrowRight,
  UserPlusIcon as UserPlus,
  SignInIcon as SignIn,
} from "@phosphor-icons/react";
import { setToken } from "@/lib/api";
import { BrandMark } from "@/components/shared/BrandMark";

const ACCENT = "#60a5fa";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type Mode = "signup" | "login";

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
      <path fill="#4285F4" d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-21 0-1.3-.2-2.7-.5-4z"/>
      <path fill="#34A853" d="M6.3 14.7l7 5.1C15.1 16.6 19.2 14 24 14c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 16.3 2 9.7 7.4 6.3 14.7z"/>
      <path fill="#FBBC05" d="M24 46c5.9 0 10.9-2 14.5-5.4l-6.7-5.5C29.7 36.8 27 37.8 24 37.8c-6 0-11.1-4-12.9-9.6l-7 5.4C7.8 41.1 15.3 46 24 46z"/>
      <path fill="#EA4335" d="M44.5 20H24v8.5h11.8c-.8 2.6-2.4 4.8-4.6 6.3l6.7 5.5C41.3 37.1 44.5 31 44.5 24c0-1.3-.2-2.7-.5-4z"/>
    </svg>
  );
}

export default function LoginPage() {
  const router          = useRouter();
  const { data: session, status } = useSession();
  const [mode, setMode] = useState<Mode>("signup");

  const [email,    setEmail]    = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [showPw,   setShowPw]   = useState(false);

  const [loading,  setLoading]  = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState<{ username: string; role: string } | null>(null);

  useEffect(() => {
    if (status === "authenticated" && session?.accessToken) {
      setToken(session.accessToken);
      router.replace("/dashboard");
    }
  }, [status, session, router]);

  function resetFields() {
    setEmail(""); setUsername(""); setPassword(""); setConfirm("");
    setError(""); setSuccess(null); setShowPw(false);
  }

  function switchMode(next: Mode) {
    resetFields();
    setMode(next);
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    setError("");
    await signIn("google", { callbackUrl: "/dashboard" });
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !username || !password) return;
    if (password !== confirm) { setError("Passwords do not match"); return; }
    if (password.length < 8)  { setError("Password must be at least 8 characters"); return; }

    setLoading(true); setError("");
    try {
      const res = await fetch(`${API_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.detail ?? "Signup failed"); return; }

      // Auto sign-in via NextAuth credentials
      const result = await signIn("credentials", {
        username: username.trim(),
        password,
        redirect: false,
      });
      if (result?.error) { setError(result.error); return; }
      setSuccess({ username: data.username, role: data.role });
      setTimeout(() => router.replace("/dashboard"), 900);
    } catch {
      setError("Could not connect to server");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!username || !password) return;

    setLoading(true); setError("");
    try {
      const result = await signIn("credentials", {
        username: username.trim(),
        password,
        redirect: false,
      });
      if (result?.error) { setError("Invalid username or password"); return; }
      setSuccess({ username: username.trim(), role: "" });
      setTimeout(() => router.replace("/dashboard"), 900);
    } catch {
      setError("Could not connect to server");
    } finally {
      setLoading(false);
    }
  }

  const isSignup   = mode === "signup";
  const canSubmit  = isSignup
    ? !!email && !!username && !!password && !!confirm && !loading
    : !!username && !!password && !loading;

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: "#09090b" }}
    >
      {/* dot grid */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(96,165,250,0.04) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      {/* ambient glow */}
      <div
        aria-hidden
        className="absolute pointer-events-none"
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
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: "#111114",
            border: "1px solid #27272a",
            borderTop: `1px solid ${ACCENT}25`,
            boxShadow: "0 40px 80px rgba(0,0,0,0.7), 0 0 0 1px #1a1a1f",
          }}
        >
          {/* Header */}
          <div className="px-8 pt-8 pb-5 text-center" style={{ borderBottom: "1px solid #1e1e22" }}>
            <div className="flex justify-center mb-4">
              <BrandMark size={40} color={ACCENT} />
            </div>
            <div className="font-bold text-lg tracking-tight mb-1">
              <span className="text-zinc-100">CTI</span>
              <span style={{ color: ACCENT }}>Tracker</span>
            </div>
            <AnimatePresence mode="wait">
              <motion.p
                key={mode}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className="text-zinc-500 text-xs"
              >
                {isSignup ? "Create your analyst account" : "Sign in to your analyst account"}
              </motion.p>
            </AnimatePresence>
          </div>

          <div className="px-8 py-6 space-y-4">
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
                <p className="text-[10px] text-zinc-600 mt-1">Redirecting to dashboard...</p>
              </motion.div>
            )}

            {!success && (
              <>
                {/* Google button */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading || loading}
                  className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer disabled:opacity-50"
                  style={{
                    background: "#18181b",
                    border: "1px solid #3f3f46",
                    color: "#d4d4d8",
                  }}
                >
                  <GoogleIcon />
                  {googleLoading ? "Redirecting..." : "Continue with Google"}
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px" style={{ background: "#27272a" }} />
                  <span className="text-[11px] text-zinc-600">or</span>
                  <div className="flex-1 h-px" style={{ background: "#27272a" }} />
                </div>

                <AnimatePresence mode="wait">
                  <motion.form
                    key={mode}
                    initial={{ opacity: 0, x: isSignup ? -8 : 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: isSignup ? 8 : -8 }}
                    transition={{ duration: 0.2 }}
                    onSubmit={isSignup ? handleSignup : handleLogin}
                    className="space-y-3"
                  >
                    {isSignup && (
                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                          Email
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="analyst@org.com"
                          autoComplete="email"
                          className="w-full px-3 py-2.5 rounded-lg text-sm bg-zinc-900/80 border border-zinc-800 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 transition-colors"
                          disabled={loading}
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                        Username
                      </label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder={isSignup ? "analyst_handle" : "analyst"}
                        autoComplete="username"
                        className="w-full px-3 py-2.5 rounded-lg text-sm bg-zinc-900/80 border border-zinc-800 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 transition-colors"
                        disabled={loading}
                      />
                    </div>

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
                          autoComplete={isSignup ? "new-password" : "current-password"}
                          className="w-full px-3 py-2.5 pr-10 rounded-lg text-sm bg-zinc-900/80 border border-zinc-800 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 transition-colors"
                          disabled={loading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPw((s) => !s)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                          tabIndex={-1}
                        >
                          {showPw ? <EyeSlash className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {isSignup && (
                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                          Confirm Password
                        </label>
                        <input
                          type={showPw ? "text" : "password"}
                          value={confirm}
                          onChange={(e) => setConfirm(e.target.value)}
                          placeholder="••••••••"
                          autoComplete="new-password"
                          className="w-full px-3 py-2.5 rounded-lg text-sm bg-zinc-900/80 border border-zinc-800 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 transition-colors"
                          disabled={loading}
                        />
                      </div>
                    )}

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

                    <button
                      type="submit"
                      disabled={!canSubmit}
                      className="w-full py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all mt-1"
                      style={{
                        background: canSubmit ? ACCENT : "#27272a",
                        color:      canSubmit ? "#09090b" : "#52525b",
                        cursor:     canSubmit ? "pointer" : "not-allowed",
                      }}
                    >
                      {isSignup
                        ? <><UserPlus className="w-4 h-4" weight="bold" />{loading ? "Creating account..." : "Create account"}</>
                        : <><SignIn  className="w-4 h-4" weight="bold" />{loading ? "Signing in..."       : "Sign in"}</>
                      }
                    </button>
                  </motion.form>
                </AnimatePresence>

                {/* Toggle */}
                <p className="text-center text-[12px] text-zinc-600 pt-1">
                  {isSignup ? (
                    <>Already have an account?{" "}
                      <button onClick={() => switchMode("login")} className="text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer font-medium">
                        Sign in
                      </button>
                    </>
                  ) : (
                    <>New here?{" "}
                      <button onClick={() => switchMode("signup")} className="text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer font-medium">
                        Create an account
                      </button>
                    </>
                  )}
                </p>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center justify-center mt-4 px-1">
          <Link href="/" className="text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors">
            ← Back to home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
