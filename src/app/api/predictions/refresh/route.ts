import { computeAiPicksFromHorses } from "@/lib/aiPicksFromHorses";
import type { Horse } from "@/lib/database.types";
import { createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * Updates games.ai_summary from real horse rows + Louisville weather (no racing API keys).
 * No authentication — for local / trusted family use only.
 */
export async function POST(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug") ?? "derby-2026";

  let weather: Record<string, unknown> = {};
  try {
    const w = await fetch("https://wttr.in/Louisville,KY?format=j1", {
      next: { revalidate: 300 },
    });
    if (w.ok) {
      const j = await w.json();
      const c = j?.current_condition?.[0];
      weather = {
        temp_F: c?.temp_F,
        desc: c?.weatherDesc?.[0]?.value,
        precipInches: c?.precipInches,
        time: c?.localObsDateTime,
      };
    }
  } catch {
    /* ignore */
  }

  try {
    const supabase = createServiceClient();
    const { data: game, error: gameErr } = await supabase.from("games").select("id").eq("slug", slug).maybeSingle();
    if (gameErr || !game) {
      return NextResponse.json({ error: gameErr?.message ?? "game not found" }, { status: 404 });
    }
    const { data: horseRows, error: horseErr } = await supabase
      .from("horses")
      .select("*")
      .eq("game_id", game.id)
      .order("post_position", { ascending: true });
    if (horseErr) throw horseErr;
    const horses = (horseRows ?? []) as Horse[];

    const picks = computeAiPicksFromHorses(horses);
    const weatherLine =
      weather.desc != null && weather.temp_F != null
        ? ` Louisville weather: ${String(weather.desc)}, ${String(weather.temp_F)}°F.`
        : "";

    const summary = {
      ...picks,
      note: `${picks.rationale}${weatherLine}`,
      weather,
      updatedAt: new Date().toISOString(),
    };

    const { error: updateErr } = await supabase.from("games").update({ ai_summary: summary }).eq("slug", slug);
    if (updateErr) throw updateErr;
    return NextResponse.json({ ok: true, ai_summary: summary });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "update failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
