import type { Game } from "@/lib/database.types";
import { requireRaceOfficeSession } from "@/lib/adminAuth";
import { createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

type Ctx = { params: Promise<{ slug: string }> };

/** Save official finish order and mark game settled (no money / bets). */
export async function POST(req: NextRequest, ctx: Ctx) {
  const { slug } = await ctx.params;
  const denied = requireRaceOfficeSession(req, slug);
  if (denied) return denied;
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

  await supabase.from("race_results").upsert(
    {
      game_id: gameRow.id,
      positions,
      settled_at: new Date().toISOString(),
    },
    { onConflict: "game_id" },
  );

  await supabase.from("games").update({ status: "settled" }).eq("id", gameRow.id);

  return NextResponse.json({ ok: true });
}
