"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { useConfirmSignOut } from "@/hooks/useConfirmSignOut";
import { BrandMark } from "@/components/shared/BrandMark";
import {
  SquaresFourIcon as SquaresFour,
  HashIcon as Hash,
  UsersThreeIcon as UsersThree,
  FileTextIcon as FileText,
  WifiHighIcon as WifiHigh,
  MagnifyingGlassIcon as MagnifyingGlass,
  GridFourIcon as GridFour,
  BookmarkSimpleIcon as BookmarkSimple,
  GearSixIcon as GearSix,
  ArrowLeftIcon as ArrowLeft,
  SignOutIcon,
  XIcon as X,
} from "@phosphor-icons/react";

export type Tab =
  | "overview"
  | "iocs"
  | "campaigns"
  | "reports"
  | "feed"
  | "hunt"
  | "matrix";

const ACCENT = "#60a5fa";

type PhosphorIcon = React.ComponentType<{
  className?: string;
  weight?: "thin" | "light" | "regular" | "bold" | "fill" | "duotone";
  style?: React.CSSProperties;
}>;

type NavSection = {
  label: string;
  items: { id: Tab; label: string; Icon: PhosphorIcon }[];
};

const PLATFORM_SECTIONS: NavSection[] = [
  {
    label: "Overview",
    items: [
      { id: "overview", label: "Overview", Icon: SquaresFour },
    ],
  },
  {
    label: "Collect",
    items: [
      { id: "feed", label: "Live Feed", Icon: WifiHigh },
    ],
  },
  {
    label: "Analyze",
    items: [
      { id: "iocs",      label: "IOCs",         Icon: Hash },
      { id: "hunt",      label: "IOC Hunt",     Icon: MagnifyingGlass },
      { id: "campaigns", label: "Campaigns",    Icon: UsersThree },
      { id: "matrix",    label: "ATT&CK",  Icon: GridFour },
    ],
  },
  {
    label: "Report",
    items: [
      { id: "reports", label: "Reports", Icon: FileText },
    ],
  },
];

const TOOLS_NAV: { href: string; label: string; Icon: PhosphorIcon }[] = [
  { href: "/watchlist", label: "Watchlist", Icon: BookmarkSimple },
  { href: "/settings",  label: "Settings",  Icon: GearSix },
];


interface Props {
  active: Tab;
  onChange: (tab: Tab) => void;
  counts?: Partial<Record<Tab, number>>;
  collecting?: boolean;
  watchlistCount?: number;
}

function SidebarAvatar({ name, image }: { name?: string | null; image?: string | null }) {
  if (image) {
    return (
      <img
        src={image}
        alt={name ?? "User"}
        className="w-7 h-7 rounded-full object-cover shrink-0"
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

export default function Sidebar({ active, onChange, counts, collecting, watchlistCount }: Props) {
  const { data: session } = useSession();
  const signOut = useConfirmSignOut("/");
  const pathname = usePathname();
  const router = useRouter();

  function handleTabClick(tab: Tab) {
    if (pathname === "/dashboard") {
      onChange(tab);
    } else {
      router.push(`/dashboard?tab=${tab}`);
    }
  }

  return (
    <aside
      className="hidden md:flex flex-col w-[220px] shrink-0 min-h-screen"
      style={{ background: "#09090b", borderRight: "1px solid #1c1c20" }}
    >
      {/* Brand */}
      <div
        className="flex items-center gap-2.5 px-5 h-14 shrink-0"
        style={{ borderBottom: "1px solid #1c1c20" }}
      >
        <BrandMark size={18} color={ACCENT} />
        <span className="font-bold tracking-tight text-sm">
          <span className="text-zinc-100">CTI</span>
          <span style={{ color: ACCENT }}>Tracker</span>
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
        {PLATFORM_SECTIONS.map((section) => (
          <div key={section.label}>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] px-3 pb-2 text-zinc-600">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = item.id === active;
                const count = counts?.[item.id];
                const isLive = item.id === "feed" && collecting;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabClick(item.id)}
                    className={`relative w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all cursor-pointer ${
                      isActive
                        ? ""
                        : "text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04]"
                    }`}
                    style={isActive ? { background: `${ACCENT}0c`, color: ACCENT } : undefined}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-bar"
                        className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-full"
                        style={{ background: ACCENT }}
                        transition={{ type: "spring", stiffness: 400, damping: 34 }}
                      />
                    )}

                    <item.Icon
                      className="w-4 h-4 shrink-0"
                      weight={isActive ? "bold" : "regular"}
                      style={{ color: isActive ? ACCENT : "inherit" }}
                    />
                    <span className="flex-1 text-left">{item.label}</span>

                    {isLive && (
                      <motion.span
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ repeat: Infinity, duration: 1.2 }}
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ background: ACCENT }}
                      />
                    )}

                    {!isLive && count !== undefined && count > 0 && (
                      <span
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded tabular-nums shrink-0"
                        style={
                          isActive
                            ? { background: `${ACCENT}1a`, color: ACCENT }
                            : { background: "#222226", color: "#52525b" }
                        }
                      >
                        {count > 9999 ? `${(count / 1000).toFixed(1)}k` : count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Tools */}
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] px-3 pb-2 text-zinc-600">
            Tools
          </p>
          <div className="space-y-0.5">
            {TOOLS_NAV.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all cursor-pointer"
                  style={isActive ? { background: `${ACCENT}0c`, color: ACCENT } : undefined}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-bar"
                      className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-full"
                      style={{ background: ACCENT }}
                      transition={{ type: "spring", stiffness: 400, damping: 34 }}
                    />
                  )}
                  <item.Icon
                    className={`w-4 h-4 shrink-0 ${!isActive ? "text-zinc-500" : ""}`}
                    weight={isActive ? "bold" : "regular"}
                    style={isActive ? { color: ACCENT } : undefined}
                  />
                  <span className={`flex-1 ${!isActive ? "text-zinc-500 hover:text-zinc-200" : ""}`}>{item.label}</span>
                  {item.href === "/watchlist" && watchlistCount !== undefined && watchlistCount > 0 && (
                    <span
                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded tabular-nums shrink-0"
                      style={
                        isActive
                          ? { background: `${ACCENT}1a`, color: ACCENT }
                          : { background: "#222226", color: "#52525b" }
                      }
                    >
                      {watchlistCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Bottom: user row */}
      <div className="px-3 pb-4" style={{ borderTop: "1px solid #1c1c20" }}>
        {session && (
          <div className="mt-3 rounded-xl overflow-hidden" style={{ background: "#111114", border: "1px solid #1e1e22" }}>
            <div className="flex items-center gap-2.5 px-3 py-2.5">
              <SidebarAvatar name={session.user?.name} image={session.user?.image} />
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium text-zinc-300 truncate">
                  {session.user?.name ?? "Analyst"}
                </p>
                <p className="text-[10px] text-zinc-600 truncate">
                  {session.user?.email ?? "analyst"}
                </p>
              </div>
              {!signOut.confirming ? (
                <button
                  onClick={signOut.request}
                  title="Sign out"
                  className="p-1 rounded text-zinc-600 hover:text-red-400 transition-colors cursor-pointer shrink-0"
                >
                  <SignOutIcon className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={signOut.cancel}
                  title="Cancel"
                  className="p-1 rounded text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {signOut.confirming && (
              <div
                className="px-3 py-2.5 flex items-center justify-between"
                style={{ borderTop: "1px solid #1e1e22" }}
              >
                <span className="text-[11px] text-zinc-500">Sign out?</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={signOut.cancel}
                    className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={signOut.confirm}
                    className="text-[11px] font-semibold text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.04] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" weight="bold" />
          <span>Back to Home</span>
        </Link>
      </div>
    </aside>
  );
}
