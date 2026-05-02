import { createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * Best-effort public fetch (no API keys). Updates games.ai_summary.
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

  const summary = {
    topWinner: "Commandment",
    sleeper: "Albus",
    overrated: "Chief Wallabee",
    darkHorse: "Danon Bourbon",
    weather,
    note:
      "Heuristic placeholders when live pages block bots. Edit in Race office or DB.",
    updatedAt: new Date().toISOString(),
  };

  try {
    const supabase = createServiceClient();
    const { error } = await supabase
      .from("games")
      .update({ ai_summary: summary })
      .eq("slug", slug);
    if (error) throw error;
    return NextResponse.json({ ok: true, ai_summary: summary });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "update failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
