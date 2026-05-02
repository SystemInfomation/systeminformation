import { requireRaceOfficeSession } from "@/lib/adminAuth";
import { createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

type Ctx = { params: Promise<{ slug: string }> };

/** Reset all bets and balances; clear results. Game back to open. */
export async function POST(req: NextRequest, ctx: Ctx) {
  const { slug } = await ctx.params;
  const denied = requireRaceOfficeSession(req, slug);
  if (denied) return denied;
  const supabase = createServiceClient();
  const { data: game, error: gErr } = await supabase
    .from("games")
    .select("id, starting_balance")
    .eq("slug", slug)
    .single();
  if (gErr || !game) return NextResponse.json({ error: "Game not found" }, { status: 404 });

  await supabase.from("bets").delete().eq("game_id", game.id);
  await supabase.from("top3_picks").delete().eq("game_id", game.id);
  await supabase.from("race_results").delete().eq("game_id", game.id);
  await supabase.from("messages").delete().eq("game_id", game.id);

  await supabase
    .from("profiles")
    .update({
      current_balance: game.starting_balance,
      starting_balance: game.starting_balance,
    })
    .eq("game_id", game.id);

  await supabase
    .from("games")
    .update({ status: "open", betting_locked_at: null })
    .eq("id", game.id);

  return NextResponse.json({ ok: true });
}
