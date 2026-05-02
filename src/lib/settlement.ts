import type { Bet, BetType, Game, Horse } from "@/lib/database.types";
import {
  exactaReturn,
  placeReturn,
  showReturn,
  trifectaReturn,
  winReturn,
} from "@/lib/payouts";

export type OddsSnapshot = {
  horses: { id: string; odds_num: number; odds_den: number }[];
  place_payout_ratio: number;
  show_payout_ratio: number;
  exacta_multiplier: number;
  trifecta_multiplier: number;
};

function snapshot(snapshot: Record<string, unknown>): OddsSnapshot | null {
  const h = snapshot.horses;
  if (!Array.isArray(h) || h.length === 0) return null;
  const horses = h.map((row) => {
    const o = row as Record<string, unknown>;
    return {
      id: String(o.id),
      odds_num: Number(o.odds_num),
      odds_den: Number(o.odds_den),
    };
  });
  return {
    horses,
    place_payout_ratio: Number(snapshot.place_payout_ratio ?? 0.35),
    show_payout_ratio: Number(snapshot.show_payout_ratio ?? 0.2),
    exacta_multiplier: Number(snapshot.exacta_multiplier ?? 12),
    trifecta_multiplier: Number(snapshot.trifecta_multiplier ?? 48),
  };
}

function oddsForHorse(s: OddsSnapshot, horseId: string) {
  const row = s.horses.find((x) => x.id === horseId);
  return row ?? { odds_num: 1, odds_den: 1 };
}

export function evaluateBet(
  bet: Pick<Bet, "type" | "stake" | "horse_ids" | "odds_snapshot">,
  positions: string[],
  game: Pick<
    Game,
    | "place_payout_ratio"
    | "show_payout_ratio"
    | "exacta_multiplier"
    | "trifecta_multiplier"
  >,
): { won: boolean; payout: number } {
  const snap =
    snapshot(bet.odds_snapshot as Record<string, unknown>) ?? {
      horses: bet.horse_ids.map((id) => ({ id, odds_num: 5, odds_den: 1 })),
      place_payout_ratio: game.place_payout_ratio,
      show_payout_ratio: game.show_payout_ratio,
      exacta_multiplier: game.exacta_multiplier,
      trifecta_multiplier: game.trifecta_multiplier,
    };

  const first = positions[0];
  const second = positions[1];
  const third = positions[2];

  switch (bet.type as BetType) {
    case "win": {
      const id = bet.horse_ids[0];
      const won = id === first;
      const o = oddsForHorse(snap, id);
      return { won, payout: won ? winReturn(bet.stake, o.odds_num, o.odds_den) : 0 };
    }
    case "place": {
      const id = bet.horse_ids[0];
      const top2 = new Set([first, second].filter(Boolean));
      const won = top2.has(id);
      const o = oddsForHorse(snap, id);
      return {
        won,
        payout: won
          ? placeReturn(bet.stake, o.odds_num, o.odds_den, snap.place_payout_ratio)
          : 0,
      };
    }
    case "show": {
      const id = bet.horse_ids[0];
      const top3 = new Set([first, second, third].filter(Boolean));
      const won = top3.has(id);
      const o = oddsForHorse(snap, id);
      return {
        won,
        payout: won
          ? showReturn(bet.stake, o.odds_num, o.odds_den, snap.show_payout_ratio)
          : 0,
      };
    }
    case "exacta": {
      const [a, b] = bet.horse_ids;
      const won = a === first && b === second;
      return {
        won,
        payout: won ? exactaReturn(bet.stake, snap.exacta_multiplier) : 0,
      };
    }
    case "trifecta": {
      const [a, b, c] = bet.horse_ids;
      const won = a === first && b === second && c === third;
      return {
        won,
        payout: won ? trifectaReturn(bet.stake, snap.trifecta_multiplier) : 0,
      };
    }
    default:
      return { won: false, payout: 0 };
  }
}

/** Build odds snapshot payload for RPC from horses + game. */
export function buildOddsSnapshot(
  horseIds: string[],
  horses: Horse[],
  game: Game,
): Record<string, unknown> {
  const map = new Map(horses.map((h) => [h.id, h]));
  return {
    horses: horseIds.map((id) => {
      const h = map.get(id);
      return {
        id,
        odds_num: h?.odds_num ?? 1,
        odds_den: h?.odds_den ?? 1,
      };
    }),
    place_payout_ratio: game.place_payout_ratio,
    show_payout_ratio: game.show_payout_ratio,
    exacta_multiplier: game.exacta_multiplier,
    trifecta_multiplier: game.trifecta_multiplier,
  };
}
