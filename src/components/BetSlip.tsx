"use client";

import { createClient } from "@/lib/supabase/client";
import type { BetType, Game, Horse, Profile } from "@/lib/database.types";
import { buildOddsSnapshot } from "@/lib/settlement";
import { motion } from "framer-motion";
import { useSound } from "@/components/providers";
import { useMemo, useState } from "react";

const CHIPS = [5, 10, 25, 50, 100];

export function BetSlip({
  game,
  horses,
  profile,
  locked,
  kind,
  onKindChange,
  selected,
  onSelectedChange,
}: {
  game: Game;
  horses: Horse[];
  profile: Profile | null;
  locked: boolean;
  kind: BetType;
  onKindChange: (k: BetType) => void;
  selected: string[];
  onSelectedChange: (ids: string[]) => void;
}) {
  const { playChime } = useSound();
  const [stake, setStake] = useState(25);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const need = useMemo(() => {
    if (kind === "exacta") return 2;
    if (kind === "trifecta") return 3;
    return 1;
  }, [kind]);

  function onKindClick(k: BetType) {
    onKindChange(k);
    onSelectedChange([]);
  }

  async function submit() {
    setMsg(null);
    if (!profile || locked) return;
    if (selected.length !== need) {
      setMsg(`Pick exactly ${need} horse(s) for ${kind}.`);
      return;
    }
    if (stake <= 0 || stake > profile.current_balance) {
      setMsg("Invalid stake for your balance.");
      return;
    }
    setPending(true);
    const supabase = createClient();
    const snap = buildOddsSnapshot(selected, horses, game);
    const { data, error } = await supabase.rpc("place_bet", {
      p_game_id: game.id,
      p_type: kind,
      p_stake: stake,
      p_horse_ids: selected,
      p_odds_snapshot: snap,
    });
    setPending(false);
    if (error) {
      setMsg(error.message);
      return;
    }
    playChime();
    setMsg(`Bet placed! Ref: ${String(data).slice(0, 8)}…`);
    onSelectedChange([]);
    window.location.reload();
  }

  const suggestion = useMemo(() => {
    const active = horses.filter((h) => !h.scratched);
    let best: Horse | null = null;
    let bestV = -Infinity;
    for (const h of active) {
      const implied = h.odds_den / (h.odds_num + h.odds_den);
      const m = h.model_win_prob;
      if (m == null) continue;
      const v = m - implied;
      if (v > bestV) {
        bestV = v;
        best = h;
      }
    }
    return best;
  }, [horses]);

  return (
    <motion.div
      layout
      className="rounded-3xl border border-[var(--derby-gold)]/35 bg-[var(--derby-forest)]/90 p-5 shadow-xl"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif text-xl text-[var(--derby-cream)]">Bet slip</h2>
        <div className="text-sm text-[var(--derby-muted)]">
          Balance{" "}
          <span className="font-mono font-bold text-[var(--derby-gold)]">
            ${profile?.current_balance.toFixed(0) ?? "—"}
          </span>
        </div>
      </div>

      {suggestion && (
        <p className="mt-2 rounded-xl bg-white/5 px-3 py-2 text-xs text-[var(--derby-cream)]">
          <span className="text-[var(--derby-gold)]">Smart hint:</span> biggest model-vs-odds gap right now —{" "}
          <strong>{suggestion.name}</strong>.
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {(
          [
            ["win", "Win"],
            ["place", "Place"],
            ["show", "Show"],
            ["exacta", "Exacta"],
            ["trifecta", "Trifecta"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => onKindClick(k)}
            className={
              kind === k
                ? "rounded-full bg-[var(--derby-gold)] px-3 py-1 text-xs font-bold text-[var(--derby-forest)]"
                : "rounded-full border border-white/15 px-3 py-1 text-xs text-[var(--derby-cream)]"
            }
          >
            {label}
          </button>
        ))}
      </div>

      <p className="mt-2 text-xs text-[var(--derby-muted)]">
        {kind === "win" && "Horse must finish 1st."}
        {kind === "place" && "Horse must finish 1st or 2nd (family payout curve)."}
        {kind === "show" && "Horse must finish 1st–3rd."}
        {kind === "exacta" && "Pick 1st and 2nd in exact order."}
        {kind === "trifecta" && "Pick top 3 in exact order."}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {CHIPS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setStake(c)}
            className={
              stake === c
                ? "rounded-full border border-[var(--derby-gold)] bg-[var(--derby-gold)]/20 px-3 py-1 text-xs font-semibold text-[var(--derby-gold)]"
                : "rounded-full border border-white/10 px-3 py-1 text-xs text-[var(--derby-cream)]"
            }
          >
            ${c}
          </button>
        ))}
        <input
          type="number"
          min={1}
          className="w-24 rounded-full border border-white/15 bg-transparent px-3 py-1 text-xs text-[var(--derby-cream)]"
          value={stake}
          onChange={(e) => setStake(Number(e.target.value))}
        />
      </div>

      <div className="mt-4 text-xs text-[var(--derby-muted)]">
        Selected order:{" "}
        <span className="text-[var(--derby-cream)]">
          {selected.length
            ? selected
                .map((id) => horses.find((h) => h.id === id)?.name ?? id)
                .join(" → ")
            : "—"}
        </span>
      </div>

      <button
        type="button"
        disabled={!profile || locked || pending}
        onClick={() => void submit()}
        className="mt-4 w-full rounded-2xl bg-[var(--derby-gold)] py-3 text-center font-semibold text-[var(--derby-forest)] disabled:opacity-40"
      >
        {locked ? "Betting locked" : pending ? "Placing…" : "Place pretend bet"}
      </button>
      {msg && <p className="mt-2 text-center text-xs text-[var(--derby-cream)]">{msg}</p>}
      {!profile && <p className="mt-2 text-center text-xs text-rose-300">Join the game first.</p>}
    </motion.div>
  );
}

export function useBetSelection(kind: BetType) {
  const need = kind === "exacta" ? 2 : kind === "trifecta" ? 3 : 1;
  function toggle(selected: string[], id: string) {
    if (selected.includes(id)) return selected.filter((x) => x !== id);
    if (selected.length >= need) {
      if (need === 1) return [id];
      return [...selected.slice(1), id];
    }
    return [...selected, id];
  }
  return { need, toggle };
}
