import type { Game, Horse, Profile, Top3Pick } from "@/lib/database.types";
import { top3ExactScore } from "@/lib/scoreTop3";
import type { SupabaseClient } from "@supabase/supabase-js";

export type LeaderboardRow = {
  id: string;
  name: string;
  emoji: string;
  h1: string;
  h2: string;
  h3: string;
  score: number | null;
};

export async function buildLeaderboardRows(
  supabase: SupabaseClient,
  g: Game,
): Promise<{ rows: LeaderboardRow[]; settled: boolean }> {
  const [{ data: picks }, { data: profiles }, { data: horses }, { data: result }] = await Promise.all([
    supabase.from("top3_picks").select("*").eq("game_id", g.id),
    supabase.from("profiles").select("*").eq("game_id", g.id),
    supabase.from("horses").select("*").eq("game_id", g.id),
    supabase.from("race_results").select("*").eq("game_id", g.id).maybeSingle(),
  ]);

  const horseMap = new Map((horses as Horse[] | null)?.map((h) => [h.id, h]) ?? []);
  const profileByUser = new Map((profiles as Profile[] | null)?.map((p) => [p.user_id, p]) ?? []);
  const positions = (result?.positions as string[] | undefined) ?? [];
  const settled = g.status === "settled" && positions.length >= 3;

  const rows = ((picks ?? []) as Top3Pick[]).map((tp) => {
    const p = profileByUser.get(tp.user_id);
    const score = settled ? top3ExactScore(tp.pick_first, tp.pick_second, tp.pick_third, positions) : null;
    return {
      id: tp.id,
      name: p?.display_name ?? "Player",
      emoji: p?.avatar_emoji ?? "🐎",
      h1: horseMap.get(tp.pick_first)?.name ?? "—",
      h2: horseMap.get(tp.pick_second)?.name ?? "—",
      h3: horseMap.get(tp.pick_third)?.name ?? "—",
      score,
    };
  });

  rows.sort((a, b) => {
    if (a.score != null && b.score != null && b.score !== a.score) return b.score - a.score;
    return a.name.localeCompare(b.name);
  });

  return { rows, settled };
}
