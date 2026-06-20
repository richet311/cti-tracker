"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  UserIcon as User,
  LockKeyIcon as LockKey,
  SlidersIcon as Sliders,
  ArrowLeftIcon as ArrowLeft,
  CheckIcon as Check,
  SignOutIcon as SignOutIcon,
} from "@phosphor-icons/react";
import { BrandMark as Brand } from "@/components/shared/BrandMark";

const ACCENT = "#60a5fa";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type Section = "profile" | "collection" | "security";

const SECTIONS: { id: Section; label: string; Icon: React.ComponentType<{ className?: string; weight?: string }> }[] = [
  { id: "profile",    label: "Profile",     Icon: User },
  { id: "collection", label: "Collection",  Icon: Sliders },
  { id: "security",   label: "Security",    Icon: LockKey },
];

const SOURCE_KEYS = ["malwarebazaar", "urlhaus", "feodotracker"] as const;
type SourceKey = (typeof SOURCE_KEYS)[number];
const SOURCE_LABELS: Record<SourceKey, string> = {
  malwarebazaar: "MalwareBazaar",
  urlhaus:       "URLhaus",
  feodotracker:  "FeodoTracker",
};
const LIMIT_OPTIONS = [50, 100, 200, 500] as const;

function loadPref<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="relative w-9 h-5 rounded-full transition-colors cursor-pointer shrink-0"
      style={{ background: on ? ACCENT : "#27272a" }}
    >
      <span
        className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform"
        style={{ transform: on ? "translateX(16px)" : "translateX(0)" }}
      />
    </button>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [section, setSection] = useState<Section>("profile");

  // collection prefs
  const [sources, setSources] = useState<Record<SourceKey, boolean>>({
    malwarebazaar: true,
    urlhaus: true,
    feodotracker: true,
  });
  const [limit, setLimit] = useState<number>(100);
  const [collectionSaved, setCollectionSaved] = useState(false);

  // security
  const [currentPw, setCurrentPw] = useState("");
  const [newPw,     setNewPw]     = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError,   setPwError]   = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") { router.replace("/login"); return; }
  }, [status, router]);

  useEffect(() => {
    setSources(loadPref("cti_pref_sources", {
      malwarebazaar: true, urlhaus: true, feodotracker: true,
    }));
    setLimit(loadPref("cti_pref_limit", 100));
  }, []);

  // detect hash on mount for deep links (/settings#security etc)
  useEffect(() => {
    const hash = window.location.hash.replace("#", "") as Section;
    if (SECTIONS.some((s) => s.id === hash)) setSection(hash);
  }, []);

  function saveCollection() {
    localStorage.setItem("cti_pref_sources", JSON.stringify(sources));
    localStorage.setItem("cti_pref_limit", JSON.stringify(limit));
    setCollectionSaved(true);
    setTimeout(() => setCollectionSaved(false), 2000);
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPw !== confirmPw) { setPwError("Passwords do not match"); return; }
    if (newPw.length < 8)    { setPwError("Must be at least 8 characters"); return; }

    setPwLoading(true); setPwError(""); setPwSuccess(false);
    try {
      const token = localStorage.getItem("cti_token");
      const res = await fetch(`${API_URL}/api/auth/password`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ current_password: currentPw, new_password: newPw }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setPwError(data.detail ?? "Failed to update password");
        return;
      }
      setPwSuccess(true);
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
    } catch {
      setPwError("Could not connect to server");
    } finally {
      setPwLoading(false);
    }
  }

  if (status === "loading" || !session) return null;

  const user = session.user;

  return (
    <div className="min-h-screen flex" style={{ background: "#09090b" }}>

      {/* Sidebar */}
      <aside
        className="w-[220px] shrink-0 flex flex-col min-h-screen"
        style={{ borderRight: "1px solid #1c1c20" }}
      >
        <div
          className="flex items-center gap-2.5 px-5 h-14 shrink-0"
          style={{ borderBottom: "1px solid #1c1c20" }}
        >
          <Brand size={18} color={ACCENT} />
          <span className="font-bold tracking-tight text-sm">
            <span className="text-zinc-100">CTI</span>
            <span style={{ color: ACCENT }}>Tracker</span>
          </span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] px-3 pb-2 text-zinc-600">
            Settings
          </p>
          {SECTIONS.map(({ id, label, Icon }) => {
            const active = section === id;
            return (
              <button
                key={id}
                onClick={() => setSection(id)}
                className={`relative w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all cursor-pointer ${
                  active ? "" : "text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04]"
                }`}
                style={active ? { background: `${ACCENT}0c`, color: ACCENT } : undefined}
              >
                {active && (
                  <motion.div
                    layoutId="settings-bar"
                    className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-full"
                    style={{ background: ACCENT }}
                    transition={{ type: "spring", stiffness: 400, damping: 34 }}
                  />
                )}
                <Icon
                  className="w-4 h-4 shrink-0"
                  weight={active ? "bold" : "regular"}
                />
                {label}
              </button>
            );
          })}
        </nav>

        <div className="px-3 pb-4" style={{ borderTop: "1px solid #1c1c20" }}>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.04] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" weight="bold" />
            Back to Dashboard
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] text-red-500 hover:text-red-400 hover:bg-red-500/[0.06] transition-colors cursor-pointer mt-0.5"
          >
            <SignOutIcon className="w-3.5 h-3.5" weight="bold" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 p-8 max-w-2xl">

        {/* ── Profile ── */}
        {section === "profile" && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <h1 className="text-xl font-bold text-zinc-100 mb-1">Profile</h1>
            <p className="text-sm text-zinc-500 mb-8">Your analyst account details.</p>

            {/* Avatar */}
            <div className="flex items-center gap-4 mb-8">
              {user?.image ? (
                <img
                  src={user.image}
                  alt={user.name ?? ""}
                  className="w-16 h-16 rounded-full object-cover"
                  style={{ border: `2px solid ${ACCENT}40` }}
                />
              ) : (
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold"
                  style={{ background: `${ACCENT}18`, color: ACCENT, border: `2px solid ${ACCENT}35` }}
                >
                  {(user?.name ?? "?").slice(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-[15px] font-semibold text-zinc-100">{user?.name ?? "—"}</p>
                <p className="text-sm text-zinc-500 mt-0.5">{user?.email ?? "No email"}</p>
              </div>
            </div>

            {/* Fields */}
            <div className="space-y-5">
              <Field label="Username" value={user?.name ?? "—"} readOnly />
              <Field label="Email" value={user?.email ?? "—"} readOnly />
              <Field
                label="Auth provider"
                value={user?.image ? "Google OAuth" : "Password"}
                readOnly
              />
            </div>

            <p className="text-xs text-zinc-600 mt-6">
              To change your username or email, contact your administrator.
            </p>
          </motion.div>
        )}

        {/* ── Collection Preferences ── */}
        {section === "collection" && (
          <motion.div
            key="collection"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <h1 className="text-xl font-bold text-zinc-100 mb-1">Collection</h1>
            <p className="text-sm text-zinc-500 mb-8">Configure which feeds to pull from and how many IOCs to collect per run.</p>

            {/* Sources */}
            <Section title="Data Sources">
              <p className="text-xs text-zinc-600 mb-4">Toggle which threat intelligence feeds are active during collection.</p>
              <div className="space-y-3">
                {SOURCE_KEYS.map((key) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-zinc-200">{SOURCE_LABELS[key]}</p>
                      <p className="text-xs text-zinc-600 mt-0.5">
                        {key === "malwarebazaar" && "SHA256 hashes and malware samples"}
                        {key === "urlhaus" && "Malicious URLs and C2 infrastructure"}
                        {key === "feodotracker" && "Botnet C2 IP addresses"}
                      </p>
                    </div>
                    <Toggle
                      on={sources[key]}
                      onToggle={() => setSources((s) => ({ ...s, [key]: !s[key] }))}
                    />
                  </div>
                ))}
              </div>
            </Section>

            {/* IOC limit */}
            <Section title="IOC Limit per Run">
              <p className="text-xs text-zinc-600 mb-4">Maximum number of IOCs fetched per collection run across all enabled sources.</p>
              <div className="flex gap-2 flex-wrap">
                {LIMIT_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setLimit(opt)}
                    className="px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer"
                    style={
                      limit === opt
                        ? { background: ACCENT, color: "#09090b" }
                        : { background: "#18181b", color: "#71717a", border: "1px solid #27272a" }
                    }
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </Section>

            <button
              onClick={saveCollection}
              className="mt-6 flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer"
              style={{ background: ACCENT, color: "#09090b" }}
            >
              {collectionSaved ? <><Check className="w-4 h-4" weight="bold" /> Saved</> : "Save preferences"}
            </button>
          </motion.div>
        )}

        {/* ── Security ── */}
        {section === "security" && (
          <motion.div
            key="security"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <h1 className="text-xl font-bold text-zinc-100 mb-1">Security</h1>
            <p className="text-sm text-zinc-500 mb-8">Manage your password and account access.</p>

            <Section title="Change Password">
              <form onSubmit={handleChangePassword} className="space-y-4">
                <PasswordField
                  label="Current password"
                  value={currentPw}
                  onChange={setCurrentPw}
                  disabled={pwLoading}
                  autoComplete="current-password"
                />
                <PasswordField
                  label="New password"
                  value={newPw}
                  onChange={setNewPw}
                  disabled={pwLoading}
                  autoComplete="new-password"
                />
                <PasswordField
                  label="Confirm new password"
                  value={confirmPw}
                  onChange={setConfirmPw}
                  disabled={pwLoading}
                  autoComplete="new-password"
                />

                {pwError && (
                  <p
                    className="text-xs text-red-400 px-3 py-2 rounded-lg"
                    style={{ background: "#ef444415", border: "1px solid #ef444425" }}
                  >
                    {pwError}
                  </p>
                )}
                {pwSuccess && (
                  <p
                    className="text-xs text-emerald-400 px-3 py-2 rounded-lg flex items-center gap-1.5"
                    style={{ background: "#22c55e15", border: "1px solid #22c55e25" }}
                  >
                    <Check className="w-3.5 h-3.5" weight="bold" /> Password updated successfully
                  </p>
                )}

                <button
                  type="submit"
                  disabled={pwLoading || !currentPw || !newPw || !confirmPw}
                  className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: ACCENT, color: "#09090b" }}
                >
                  {pwLoading ? "Updating..." : "Update password"}
                </button>
              </form>
            </Section>

            <Section title="Danger Zone">
              <p className="text-xs text-zinc-500 mb-4">Sign out of your account on this device.</p>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
                style={{ background: "#ef444415", color: "#f87171", border: "1px solid #ef444430" }}
              >
                <SignOutIcon className="w-4 h-4" weight="bold" />
                Sign out
              </button>
            </Section>
          </motion.div>
        )}
      </main>
    </div>
  );
}

function Field({ label, value, readOnly }: { label: string; value: string; readOnly?: boolean }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
        {label}
      </label>
      <input
        readOnly={readOnly}
        value={value}
        onChange={() => {}}
        className="w-full px-3 py-2.5 rounded-lg text-sm border text-zinc-300"
        style={{
          background: readOnly ? "#111114" : "#18181b",
          borderColor: "#27272a",
          cursor: readOnly ? "default" : "text",
        }}
      />
    </div>
  );
}

function PasswordField({
  label, value, onChange, disabled, autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  autoComplete?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          disabled={disabled}
          placeholder="••••••••"
          className="w-full px-3 py-2.5 pr-10 rounded-lg text-sm border text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 transition-colors"
          style={{ background: "#18181b", borderColor: "#27272a" }}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-600 hover:text-zinc-400 transition-colors cursor-pointer"
          tabIndex={-1}
        >
          {show ? "hide" : "show"}
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl p-5 mb-5"
      style={{ background: "#111114", border: "1px solid #1e1e22" }}
    >
      <h2 className="text-[13px] font-semibold text-zinc-300 mb-4">{title}</h2>
      {children}
    </div>
  );
}
