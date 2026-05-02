import { ConfettiCelebration } from "@/components/ConfettiCelebration";
import { createClient } from "@/lib/supabase/server";
import type { Game, Horse, Profile, RaceResult } from "@/lib/database.types";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ slug: string }> };

export default async function ResultsPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: game } = await supabase.from("games").select("*").eq("slug", slug).maybeSingle();
  if (!game) notFound();
  const g = game as Game;

  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .eq("game_id", g.id)
    .order("current_balance", { ascending: false });

  const { data: result } = await supabase.from("race_results").select("*").eq("game_id", g.id).maybeSingle();

  const { data: horses } = await supabase.from("horses").select("*").eq("game_id", g.id);
  const horseMap = new Map((horses as Horse[] | null)?.map((h) => [h.id, h]) ?? []);

  const rr = result as RaceResult | null;
  const positions = rr?.positions ?? [];
  const top3 = positions.slice(0, 3).map((id) => horseMap.get(id)?.name ?? id);

  const list = (profiles ?? []) as Profile[];
  const podium = list.slice(0, 3);
  const showConfetti = g.status === "settled" && list.length > 0;

  return (
    <div className="space-y-8">
      <ConfettiCelebration fire={showConfetti} />
      <div>
        <h1 className="font-serif text-3xl font-bold text-[var(--foreground)]">Results</h1>
        <p className="text-sm text-[var(--derby-muted)]">
          {g.status === "settled" ? "Race scored — crowns distributed." : "Race not settled yet. Someone with the race office link can enter finishes."}
        </p>
      </div>

      {top3.length > 0 && (
        <div className="rounded-3xl border border-[var(--derby-gold)]/35 bg-[var(--derby-forest)]/80 p-6 text-[var(--derby-cream)]">
          <h2 className="font-serif text-lg text-[var(--derby-gold)]">Official top 3 (race office)</h2>
          <ol className="mt-3 list-decimal space-y-1 pl-5">
            {top3.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ol>
        </div>
      )}

      {g.status === "settled" && (
        <div className="grid gap-4 md:grid-cols-3">
          {podium.map((p, i) => (
            <div
              key={p.id}
              className="rounded-3xl border border-white/10 bg-white/5 p-6 text-center text-[var(--foreground)]"
            >
              <div className="text-4xl">{i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}</div>
              <div className="mt-2 font-serif text-xl font-semibold">
                {p.avatar_emoji} {p.display_name}
              </div>
              <div className="mt-1 font-mono text-[var(--derby-gold)]">${Number(p.current_balance).toFixed(0)}</div>
              <div className="text-xs text-[var(--derby-muted)]">final bankroll</div>
            </div>
          ))}
        </div>
      )}

      <Link href={`/g/${slug}/leaderboard`} className="inline-block text-[var(--derby-gold)]">
        ← Back to full leaderboard
      </Link>
    </div>
  );
}
