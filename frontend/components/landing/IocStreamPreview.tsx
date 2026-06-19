import { ACCENT } from "./landing-constants";

const ROWS = [
  { type: "SHA256", value: "a1b2c3d4e5f6a1b2...", src: "MB" },
  { type: "URL",    value: "http://malicious-c2.ru/payload...", src: "UH" },
  { type: "IP",     value: "185.220.101.47", src: "UH" },
  { type: "MD5",    value: "5f4dcc3b5aa765d6...", src: "MB" },
];

export function IocStreamPreview() {
  return (
    <div
      className="rounded-lg overflow-hidden text-[10px] font-mono w-full"
      style={{ border: "1px solid #3f3f46" }}
    >
      <div
        className="flex items-center justify-between px-3 py-2 border-b"
        style={{ background: "#18181b", borderColor: "#3f3f46" }}
      >
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: ACCENT }} />
          <span style={{ color: "#a1a1aa" }} className="tracking-wide">ioc_stream</span>
        </div>
        <span style={{ color: ACCENT }} className="opacity-70">4 new</span>
      </div>
      {ROWS.map((row, i) => (
        <div
          key={i}
          className="flex items-center gap-2 px-3 py-1.5 border-b last:border-0"
          style={{ background: "#111114", borderColor: "#27272a" }}
        >
          <span
            className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold"
            style={{ color: ACCENT, background: `${ACCENT}14`, border: `1px solid ${ACCENT}26` }}
          >
            {row.type}
          </span>
          <span style={{ color: "#a1a1aa" }} className="truncate flex-1">{row.value}</span>
          <span style={{ color: "#52525b" }} className="shrink-0">{row.src}</span>
        </div>
      ))}
    </div>
  );
}
