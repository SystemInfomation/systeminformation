import { createClient } from "@/lib/supabase/server";
import type { Game, Horse } from "@/lib/database.types";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string }> };

/**
 * Official finish order for a game (from race_results), with horse names and post numbers.
 * Uses the viewer's Supabase session — same access as the Results page (RLS).
 */
export async function GET(_req: Request, ctx: Ctx) {
  const { slug } = await ctx.params;
  const supabase = await createClient();
  const { data: game, error: gameErr } = await supabase.from("games").select("*").eq("slug", slug).maybeSingle();
  if (gameErr || !game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }
  const g = game as Game;

  const [{ data: result }, { data: horses }] = await Promise.all([
    supabase.from("race_results").select("*").eq("game_id", g.id).maybeSingle(),
    supabase.from("horses").select("*").eq("game_id", g.id),
  ]);

  const horseMap = new Map((horses as Horse[] | null)?.map((h) => [h.id, h]) ?? []);
  const ids = (result?.positions as string[] | undefined) ?? [];

  const finish_order = ids.map((id, index) => {
    const h = horseMap.get(id);
    return {
      place: index + 1,
      horse_id: id,
      name: h?.name ?? null,
      post_position: h?.post_position ?? null,
    };
  });

  return NextResponse.json({
    slug: g.slug,
    game_status: g.status,
    settled: g.status === "settled",
    settled_at: result?.settled_at ?? null,
    finish_order,
    position_horse_ids: ids,
  });
}
