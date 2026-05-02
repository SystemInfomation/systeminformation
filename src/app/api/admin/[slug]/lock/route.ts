import { createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

type Ctx = { params: Promise<{ slug: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  const { slug } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const locked = Boolean(body.locked);
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("games")
    .update({
      status: locked ? "locked" : "open",
      betting_locked_at: locked ? new Date().toISOString() : null,
    })
    .eq("slug", slug)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
