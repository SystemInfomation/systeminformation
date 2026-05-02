import { requireRaceOfficeSession } from "@/lib/adminAuth";
import { createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

type Ctx = { params: Promise<{ slug: string }> };

/** PATCH game settings (multipliers, race time, ai_summary, etc.) */
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { slug } = await ctx.params;
  const denied = requireRaceOfficeSession(req, slug);
  if (denied) return denied;
  const body = await req.json();
  const supabase = createServiceClient();
  const patch: Record<string, unknown> = {};
  const keys = [
    "name",
    "race_start_at",
    "betting_locked_at",
    "starting_balance",
    "place_payout_ratio",
    "show_payout_ratio",
    "exacta_multiplier",
    "trifecta_multiplier",
    "ai_summary",
  ] as const;
  for (const k of keys) {
    if (k in body) patch[k] = body[k];
  }
  const { data, error } = await supabase
    .from("games")
    .update(patch)
    .eq("slug", slug)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
