import type { Horse } from "@/lib/database.types";

/** Morning-line style n–d → rough win probability (profit n per d staked). */
export function impliedWinProb(h: Horse): number {
  const n = Math.max(1, h.odds_num);
  const d = Math.max(1, h.odds_den);
  return d / (n + d);
}

function compositeScore(h: Horse, implied: number): number {
  const model = h.model_win_prob != null ? Number(h.model_win_prob) : null;
  if (model != null) return 0.55 * model + 0.45 * implied;
  return implied;
}

type Scored = { h: Horse; implied: number; score: number };

function scoreActive(horses: Horse[]): Scored[] {
  return horses
    .filter((h) => !h.scratched)
    .map((h) => {
      const implied = impliedWinProb(h);
      return { h, implied, score: compositeScore(h, implied) };
    });
}

function hypeGap(s: Scored): number {
  const model = s.h.model_win_prob != null ? Number(s.h.model_win_prob) : s.implied * 0.72;
  return s.implied - model;
}

/**
 * Picks derived from post positions, morning-line odds, and optional model_win_prob.
 * No external AI — transparent heuristics for the family pool.
 */
export function computeAiPicksFromHorses(horses: Horse[]): {
  topWinner: string;
  sleeper: string;
  overrated: string;
  darkHorse: string;
  rationale: string;
} {
  const active = scoreActive(horses);
  if (!active.length) {
    return {
      topWinner: "—",
      sleeper: "—",
      overrated: "—",
      darkHorse: "—",
      rationale: "Add horses in Race office, then refresh predictions.",
    };
  }

  const byImpliedAsc = [...active].sort((a, b) => a.implied - b.implied);
  const byScoreDesc = [...active].sort((a, b) => b.score - a.score);

  const topWinner = byScoreDesc[0]!.h.name;
  const used = new Set<string>([topWinner]);

  // Long shots: weaker half by implied probability
  const longShotCut = Math.max(1, Math.floor(byImpliedAsc.length / 2));
  const longShots = byImpliedAsc.slice(0, longShotCut);
  const sleeperEntry = [...longShots].sort((a, b) => b.score - a.score).find((s) => !used.has(s.h.name));
  const sleeper = sleeperEntry?.h.name ?? longShots.find((s) => !used.has(s.h.name))?.h.name ?? topWinner;
  used.add(sleeper);

  // Favorites: stronger third by implied (chalk bucket)
  const favCount = Math.max(1, Math.ceil(byImpliedAsc.length / 3));
  const favorites = byImpliedAsc.slice(-favCount);
  const overratedEntry = [...favorites].sort((a, b) => hypeGap(b) - hypeGap(a)).find((s) => !used.has(s.h.name));
  const overrated =
    overratedEntry?.h.name ?? [...favorites].sort((a, b) => hypeGap(b) - hypeGap(a))[0]?.h.name ?? "—";
  if (overrated !== "—") used.add(overrated);

  // Dark horse: value = score density vs implied among bottom 40% by odds
  const dhCount = Math.max(1, Math.ceil(byImpliedAsc.length * 0.4));
  const dhPool = byImpliedAsc.slice(0, dhCount);
  const withValue = dhPool.map((s) => ({
    ...s,
    value: s.score / Math.max(0.03, s.implied),
  }));
  const darkEntry = [...withValue].sort((a, b) => b.value - a.value).find((s) => !used.has(s.h.name));
  const darkHorse =
    darkEntry?.h.name ?? [...withValue].sort((a, b) => b.value - a.value).find((s) => s.h.name !== topWinner)?.h.name ?? sleeper;

  const hasModel = horses.some((h) => !h.scratched && h.model_win_prob != null);
  const rationale = hasModel
    ? "Blend of your morning-line odds and stored model probabilities (55% / 45%). Refresh after you edit horses."
    : "From morning-line odds only — set model win % on horses in Race office for sharper picks.";

  return { topWinner, sleeper, overrated, darkHorse, rationale };
}
