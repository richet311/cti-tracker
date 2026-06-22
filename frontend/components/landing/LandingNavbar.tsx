"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  GearSixIcon as GearSix,
  SignOutIcon as SignOutIcon,
} from "@phosphor-icons/react";
import { BrandMark } from "@/components/shared/BrandMark";
import { SignOutModal } from "@/components/shared/SignOutModal";
import { ACCENT } from "./landing-constants";
import { useConfirmSignOut } from "@/hooks/useConfirmSignOut";

interface Props {
  scrolled: boolean;
}

function UserAvatar({ name, image }: { name?: string | null; image?: string | null }) {
  if (image) {
    return (
      <img
        src={image}
        alt={name ?? "User"}
        className="w-7 h-7 rounded-full object-cover"
        style={{ border: `1.5px solid ${ACCENT}40` }}
      />
    );
  }
  const initials = (name ?? "?")
    .split(/[\s_]/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div
      className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
      style={{ background: `${ACCENT}20`, color: ACCENT, border: `1.5px solid ${ACCENT}35` }}
    >
      {initials}
    </div>
  );
}

function AvatarDropdown({ session }: { session: NonNullable<ReturnType<typeof useSession>["data"]> }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const signOut = useConfirmSignOut("/");

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center cursor-pointer rounded-full transition-opacity hover:opacity-80"
      >
        <UserAvatar name={session.user?.name} image={session.user?.image} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-52 rounded-xl overflow-hidden z-50"
          style={{
            background: "#111114",
            border: "1px solid #27272a",
            boxShadow: "0 16px 40px rgba(0,0,0,0.6)",
          }}
        >
          {/* User info header */}
          <div className="px-4 py-3" style={{ borderBottom: "1px solid #1e1e22" }}>
            <p className="text-[13px] font-semibold text-zinc-100 truncate">
              {session.user?.name ?? "Analyst"}
            </p>
            {session.user?.email && (
              <p className="text-[11px] text-zinc-500 truncate mt-0.5">{session.user.email}</p>
            )}
          </div>

          {/* Menu items */}
          <div className="py-1">
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.05] transition-colors cursor-pointer"
            >
              <GearSix className="w-3.5 h-3.5 shrink-0" />
              Settings
            </Link>
          </div>

          {/* Sign out */}
          <div style={{ borderTop: "1px solid #1e1e22" }} className="py-1">
            <button
              onClick={() => { setOpen(false); signOut.request(); }}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-[13px] text-red-400 hover:text-red-300 hover:bg-red-500/[0.08] transition-colors cursor-pointer"
            >
              <SignOutIcon className="w-3.5 h-3.5 shrink-0" />
              Sign out
            </button>
          </div>
        </div>
      )}

      <SignOutModal
        open={signOut.confirming}
        onCancel={signOut.cancel}
        onConfirm={signOut.confirm}
      />
    </div>
  );
}

export function LandingNavbar({ scrolled }: Props) {
  const { data: session } = useSession();
  const authed = session != null;

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-50 h-14 flex items-center justify-between px-6 sm:px-10 transition-all duration-300 ${
        scrolled
          ? "border-b border-zinc-200/80 dark:border-zinc-900 bg-[#d5d9e8]/90 dark:bg-[#09090b]/90 backdrop-blur-xl"
          : "border-b border-transparent"
      }`}
    >
      <div className="flex items-center gap-2">
        <BrandMark size={20} color={ACCENT} />
        <span className="font-bold tracking-tight text-sm">
          <span className="text-zinc-900 dark:text-zinc-100">CTI</span>
          <span style={{ color: ACCENT }}>Tracker</span>
        </span>
      </div>

      <div className="hidden sm:flex items-center gap-7 text-sm text-zinc-500 dark:text-zinc-400">
        <a href="#capabilities" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer">
          Capabilities
        </a>
        <a href="#sources" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer">
          Sources
        </a>
        <a href="#how-it-works" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer">
          How it works
        </a>
      </div>

      <div className="flex items-center gap-3">
        {authed ? (
          <>
            <Link
              href="/dashboard"
              className="px-4 py-1.5 rounded-md text-sm font-semibold transition-all hover:brightness-110 cursor-pointer"
              style={{ background: ACCENT, color: "#09090b" }}
            >
              Dashboard
            </Link>
            <AvatarDropdown session={session} />
          </>
        ) : (
          <Link
            href="/login"
            className="px-4 py-1.5 rounded-md text-sm font-semibold transition-all hover:brightness-110 cursor-pointer"
            style={{ background: ACCENT, color: "#09090b" }}
          >
            Get Started
          </Link>
        )}
      </div>
    </nav>
  );
}
