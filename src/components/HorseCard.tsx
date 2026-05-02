"use client";

import { motion } from "framer-motion";
import type { Horse } from "@/lib/database.types";
import { impliedWinProb } from "@/lib/payouts";

type Props = {
  horse: Horse;
  selected: boolean;
  onSelect: () => void;
  disabled?: boolean;
  showValueHint?: number | null;
};

export function HorseCard({ horse, selected, onSelect, disabled, showValueHint }: Props) {
  const implied = impliedWinProb(horse.odds_num, horse.odds_den);
  const model = horse.model_win_prob ?? null;
  const value = model != null ? model - implied : null;

  return (
    <motion.button
      type="button"
      layout
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      disabled={disabled || horse.scratched}
      className={[
        "relative w-full rounded-2xl border p-4 text-left transition-colors",
        horse.scratched
          ? "border-white/10 bg-black/20 opacity-50 line-through"
          : selected
            ? "border-[var(--derby-gold)] bg-[var(--derby-gold)]/15 shadow-[0_0_24px_rgba(201,162,39,0.25)]"
            : "border-white/10 bg-[var(--derby-forest)]/60 hover:border-[var(--derby-gold)]/40",
        disabled ? "pointer-events-none opacity-60" : "",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--derby-gold)]/20 text-sm font-bold text-[var(--derby-gold)]">
              {horse.post_position}
            </span>
            <span className="font-serif text-lg font-semibold text-[var(--derby-cream)]">{horse.name}</span>
          </div>
          <p className="mt-1 text-xs text-[var(--derby-muted)]">
            {horse.jockey ?? "—"} · {horse.trainer ?? "—"}
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold text-[var(--derby-gold)]">
            {horse.odds_num}/{horse.odds_den}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-[var(--derby-muted)]">odds</div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
        <span className="rounded-full bg-white/5 px-2 py-0.5 text-[var(--derby-cream)]">
          Win prob ~{(implied * 100).toFixed(1)}%
        </span>
        {model != null && (
          <span className="rounded-full bg-white/5 px-2 py-0.5 text-[var(--derby-cream)]">
            Model {(model * 100).toFixed(1)}%
          </span>
        )}
        {horse.ai_confidence && (
          <span className="rounded-full border border-[var(--derby-gold)]/30 px-2 py-0.5 text-[var(--derby-muted)]">
            AI {horse.ai_confidence}
          </span>
        )}
        {showValueHint != null && value != null && (
          <span
            className={
              value >= 0
                ? "rounded-full bg-emerald-500/15 px-2 py-0.5 text-emerald-200"
                : "rounded-full bg-rose-500/15 px-2 py-0.5 text-rose-200"
            }
          >
            Value {value >= 0 ? "+" : ""}{(value * 100).toFixed(1)}%
          </span>
        )}
      </div>
    </motion.button>
  );
}
