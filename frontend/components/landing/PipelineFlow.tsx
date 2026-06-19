import { motion } from "framer-motion";
import {
  DatabaseIcon as Database,
  MagnifyingGlassIcon as MagnifyingGlass,
  FileTextIcon as FileText,
} from "@phosphor-icons/react";
import { ACCENT } from "./landing-constants";

const NODES = [
  { label: "COLLECT", Icon: Database },
  { label: "ANALYZE", Icon: MagnifyingGlass },
  { label: "REPORT",  Icon: FileText },
];

export function PipelineFlow() {
  return (
    <div className="flex items-center gap-0">
      {NODES.map((n, i) => (
        <div key={n.label} className="flex items-center">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.12, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
            style={{
              background: "#18181b",
              border: `1px solid ${ACCENT}35`,
              boxShadow: `0 0 24px ${ACCENT}10`,
            }}
          >
            <n.Icon className="w-3.5 h-3.5" weight="bold" style={{ color: ACCENT, opacity: 0.9 }} />
            <span className="text-[10px] font-mono font-bold tracking-[0.14em]" style={{ color: ACCENT }}>
              {n.label}
            </span>
          </motion.div>
          {i < NODES.length - 1 && (
            <motion.div
              className="flex items-center px-1"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 + 0.2 }}
            >
              <span style={{ color: ACCENT, opacity: 0.55, fontSize: 18, lineHeight: 1, fontWeight: 300 }}>
                →
              </span>
            </motion.div>
          )}
        </div>
      ))}
    </div>
  );
}
