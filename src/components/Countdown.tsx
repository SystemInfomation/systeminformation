"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

export function Countdown({ targetIso }: { targetIso: string }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const target = new Date(targetIso).getTime();
  const diff = Math.max(0, target - now);
  const s = Math.floor(diff / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-2 gap-3 sm:grid-cols-4"
    >
      {[
        { label: "Days", v: d },
        { label: "Hours", v: h },
        { label: "Min", v: m },
        { label: "Sec", v: sec },
      ].map((x) => (
        <div
          key={x.label}
          className="rounded-2xl border border-[var(--derby-gold)]/35 bg-[var(--derby-forest)]/80 px-4 py-4 text-center shadow-lg"
        >
          <div className="font-mono text-3xl font-bold tabular-nums text-[var(--derby-gold)]">
            {x.label === "Days" ? x.v : pad(x.v)}
          </div>
          <div className="text-xs uppercase tracking-widest text-[var(--derby-muted)]">{x.label}</div>
        </div>
      ))}
    </motion.div>
  );
}
