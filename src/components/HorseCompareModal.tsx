"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { Horse } from "@/lib/database.types";
import { impliedWinProb } from "@/lib/payouts";

export function HorseCompareModal({
  open,
  onClose,
  a,
  b,
}: {
  open: boolean;
  onClose: () => void;
  a: Horse | null;
  b: Horse | null;
}) {
  return (
    <AnimatePresence>
      {open && a && b && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-4 sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-3xl border border-[var(--derby-gold)]/35 bg-[var(--derby-forest)] p-6 shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-serif text-xl text-[var(--derby-cream)]">Horse compare</h3>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-white/15 px-3 py-1 text-sm text-[var(--derby-cream)]"
              >
                Close
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {[a, b].map((h) => (
                <div key={h.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="text-xs text-[var(--derby-muted)]">#{h.post_position}</div>
                  <div className="font-serif text-lg font-semibold text-[var(--derby-gold)]">{h.name}</div>
                  <dl className="mt-3 space-y-2 text-sm text-[var(--derby-cream)]">
                    <div className="flex justify-between gap-2">
                      <dt className="text-[var(--derby-muted)]">Odds</dt>
                      <dd>
                        {h.odds_num}/{h.odds_den}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-[var(--derby-muted)]">Implied win</dt>
                      <dd>{(impliedWinProb(h.odds_num, h.odds_den) * 100).toFixed(1)}%</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-[var(--derby-muted)]">Model</dt>
                      <dd>{h.model_win_prob != null ? `${(h.model_win_prob * 100).toFixed(1)}%` : "—"}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-[var(--derby-muted)]">Jockey</dt>
                      <dd className="text-right">{h.jockey ?? "—"}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-[var(--derby-muted)]">Trainer</dt>
                      <dd className="text-right">{h.trainer ?? "—"}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-[var(--derby-muted)]">AI tag</dt>
                      <dd>{h.ai_confidence ?? "—"}</dd>
                    </div>
                  </dl>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
