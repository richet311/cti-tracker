import { ACCENT, MARQUEE_ITEMS } from "./landing-constants";

export function ThreatMarquee() {
  const items = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];
  return (
    <div
      className="overflow-hidden py-3"
      style={{ background: "#07070a", borderTop: "1px solid #18181b", borderBottom: "1px solid #18181b" }}
    >
      <div
        className="flex gap-10 whitespace-nowrap"
        style={{ animation: "marquee-left 38s linear infinite" }}
      >
        {items.map((item, i) => (
          <span
            key={i}
            className="text-[9px] font-mono font-bold uppercase tracking-[0.22em] shrink-0 flex items-center gap-2.5"
            style={{ color: "#52525b" }}
          >
            <span style={{ color: ACCENT, opacity: 0.4, fontSize: 12 }}>·</span>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
