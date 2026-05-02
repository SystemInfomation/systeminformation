import type { Bet, Game } from "@/lib/database.types";
import { evaluateBet } from "@/lib/settlement";
import { createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

type Ctx = { params: Promise<{ slug: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  const { slug } = await ctx.params;
  const body = await req.json();
  const positions = body.positions as string[] | undefined;
  if (!positions?.length) {
    return NextResponse.json({ error: "positions required" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data: game, error: gErr } = await supabase
    .from("games")
    .select("*")
    .eq("slug", slug)
    .single();
  if (gErr || !game) return NextResponse.json({ error: "Game not found" }, { status: 404 });

  const gameRow = game as Game;

  const { data: bets, error: bErr } = await supabase
    .from("bets")
    .select("*")
    .eq("game_id", gameRow.id)
    .eq("status", "pending");
  if (bErr) return NextResponse.json({ error: bErr.message }, { status: 400 });

  const gains = new Map<string, number>();

  for (const raw of bets ?? []) {
    const bet = raw as Bet;
    const { won, payout } = evaluateBet(bet, positions, gameRow);
    await supabase
      .from("bets")
      .update({
        status: won ? "won" : "lost",
        payout,
      })
      .eq("id", bet.id);
    if (payout > 0) {
      gains.set(bet.user_id, (gains.get(bet.user_id) ?? 0) + payout);
    }
  }

  for (const [userId, add] of gains) {
    const { data: prof } = await supabase
      .from("profiles")
      .select("current_balance")
      .eq("user_id", userId)
      .eq("game_id", gameRow.id)
      .single();
    if (prof) {
      await supabase
        .from("profiles")
        .update({ current_balance: Number(prof.current_balance) + add })
        .eq("user_id", userId)
        .eq("game_id", gameRow.id);
    }
  }

  await supabase.from("race_results").upsert(
    {
      game_id: gameRow.id,
      positions,
      settled_at: new Date().toISOString(),
    },
    { onConflict: "game_id" },
  );

  await supabase.from("games").update({ status: "settled" }).eq("id", gameRow.id);

  return NextResponse.json({ ok: true, settled: (bets ?? []).length });
}
