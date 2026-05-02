"use client";

import { BetSlip, useBetSelection } from "@/components/BetSlip";
import { HorseCard } from "@/components/HorseCard";
import { HorseCompareModal } from "@/components/HorseCompareModal";
import { TrashTalk } from "@/components/TrashTalk";
import type { BetType, Game, Horse, Profile } from "@/lib/database.types";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";

export function BettingClient({
  game,
  horses,
  profile,
}: {
  game: Game;
  horses: Horse[];
  profile: Profile | null;
}) {
  const locked = game.status !== "open";
  const [kind, setKind] = useState<BetType>("win");
  const { toggle } = useBetSelection(kind);
  const [selected, setSelected] = useState<string[]>([]);
  const [compare, setCompare] = useState<[Horse | null, Horse | null]>([null, null]);
  const [compareOpen, setCompareOpen] = useState(false);

  const sorted = useMemo(
    () => [...horses].sort((a, b) => a.post_position - b.post_position),
    [horses],
  );

  function onHorseClick(h: Horse) {
    if (locked) return;
    setSelected((s) => toggle(s, h.id));
  }

  function onHorseLongPress(h: Horse) {
    setCompare((c) => {
      if (!c[0]) return [h, null];
      if (!c[1] && c[0].id !== h.id) return [c[0], h];
      return [h, null];
    });
    setCompareOpen(true);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <div>
        <motion.h1
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-serif text-3xl font-bold text-[var(--foreground)]"
        >
          Racebook
        </motion.h1>
        <p className="mt-1 text-sm text-[var(--derby-muted)]">
          Tap horses in order for exacta/trifecta. Double-tap vibe: use Compare on two picks.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {sorted.map((h) => (
            <div key={h.id} className="relative">
              <HorseCard
                horse={h}
                selected={selected.includes(h.id)}
                onSelect={() => onHorseClick(h)}
                disabled={locked}
                showValueHint={1}
              />
              <button
                type="button"
                onClick={() => onHorseLongPress(h)}
                className="mt-1 w-full rounded-lg border border-white/10 py-1 text-[10px] text-[var(--derby-muted)] hover:text-[var(--derby-gold)]"
              >
                Compare stack
              </button>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-6">
        <BetSlip
          game={game}
          horses={horses}
          profile={profile}
          locked={locked}
          kind={kind}
          onKindChange={(k) => {
            setKind(k);
            setSelected([]);
          }}
          selected={selected}
          onSelectedChange={setSelected}
        />
        <TrashTalk gameId={game.id} profile={profile} />
      </div>
      <HorseCompareModal
        open={compareOpen}
        onClose={() => setCompareOpen(false)}
        a={compare[0]}
        b={compare[1]}
      />
    </div>
  );
}
