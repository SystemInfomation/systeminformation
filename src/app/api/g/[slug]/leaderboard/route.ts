import { buildLeaderboardRows } from "@/lib/leaderboardRows";
import type { Game } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { slug } = await ctx.params;
  const supabase = await createClient();
  const { data: game, error: gameErr } = await supabase.from("games").select("*").eq("slug", slug).maybeSingle();
  if (gameErr || !game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }
  const g = game as Game;
  const { rows, settled } = await buildLeaderboardRows(supabase, g);
  return NextResponse.json({ rows, settled });
}
