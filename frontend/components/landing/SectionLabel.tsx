import { ACCENT } from "./landing-constants";

interface Props {
  children: string;
}

export function SectionLabel({ children }: Props) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <div
        className="h-px w-6 shrink-0"
        style={{ background: `linear-gradient(90deg, ${ACCENT}, transparent)` }}
      />
      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
        {children}
      </span>
    </div>
  );
}
