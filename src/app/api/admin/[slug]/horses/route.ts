import { requireRaceOfficeSession } from "@/lib/adminAuth";
import { createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

type Ctx = { params: Promise<{ slug: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  const { slug } = await ctx.params;
  const denied = requireRaceOfficeSession(req, slug);
  if (denied) return denied;
  const supabase = createServiceClient();
  const { data: game } = await supabase
    .from("games")
    .select("id")
    .eq("slug", slug)
    .single();
  if (!game) return NextResponse.json({ error: "Game not found" }, { status: 404 });

  const body = await req.json();
  const row = {
    game_id: game.id,
    post_position: Number(body.post_position),
    name: String(body.name),
    jockey: body.jockey ?? null,
    trainer: body.trainer ?? null,
    odds_num: Number(body.odds_num ?? 5),
    odds_den: Number(body.odds_den ?? 1),
    model_win_prob: body.model_win_prob != null ? Number(body.model_win_prob) : null,
    ai_confidence: body.ai_confidence ?? null,
    scratched: Boolean(body.scratched),
  };

  if (body.id) {
    const { data, error } = await supabase
      .from("horses")
      .update(row)
      .eq("id", body.id)
      .eq("game_id", game.id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  }

  const { data, error } = await supabase.from("horses").insert(row).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const { slug } = await ctx.params;
  const denied = requireRaceOfficeSession(req, slug);
  if (denied) return denied;
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const supabase = createServiceClient();
  const { data: game } = await supabase.from("games").select("id").eq("slug", slug).single();
  if (!game) return NextResponse.json({ error: "Game not found" }, { status: 404 });
  const { error } = await supabase.from("horses").delete().eq("id", id).eq("game_id", game.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
