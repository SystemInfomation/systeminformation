export type GameStatus = "open" | "locked" | "settled";
export type BetType = "win" | "place" | "show" | "exacta" | "trifecta";
export type BetStatus = "pending" | "won" | "lost";

export type Game = {
  id: string;
  slug: string;
  name: string;
  race_start_at: string;
  betting_locked_at: string | null;
  status: GameStatus;
  starting_balance: number;
  place_payout_ratio: number;
  show_payout_ratio: number;
  exacta_multiplier: number;
  trifecta_multiplier: number;
  ai_summary: Record<string, unknown>;
  created_at: string;
};

export type Profile = {
  id: string;
  user_id: string;
  game_id: string;
  display_name: string;
  starting_balance: number;
  current_balance: number;
  avatar_emoji: string;
  created_at: string;
};

export type Horse = {
  id: string;
  game_id: string;
  post_position: number;
  name: string;
  jockey: string | null;
  trainer: string | null;
  odds_num: number;
  odds_den: number;
  model_win_prob: number | null;
  ai_confidence: string | null;
  scratched: boolean;
  created_at: string;
};

export type Bet = {
  id: string;
  user_id: string;
  game_id: string;
  type: BetType;
  stake: number;
  horse_ids: string[];
  odds_snapshot: Record<string, unknown>;
  status: BetStatus;
  payout: number;
  created_at: string;
};

export type RaceResult = {
  id: string;
  game_id: string;
  positions: string[];
  settled_at: string;
};

export type Message = {
  id: string;
  game_id: string;
  user_id: string;
  body: string;
  created_at: string;
};

export type Top3Pick = {
  id: string;
  game_id: string;
  user_id: string;
  pick_first: string;
  pick_second: string;
  pick_third: string;
  updated_at: string;
};
