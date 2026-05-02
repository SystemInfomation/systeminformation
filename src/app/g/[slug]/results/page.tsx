import { ConfettiCelebration } from "@/components/ConfettiCelebration";
import { HorseNumberCloth } from "@/components/HorseNumberCloth";
import { createClient } from "@/lib/supabase/server";
import type { Game, Horse, Profile, Top3Pick } from "@/lib/database.types";
import { top3ExactScore } from "@/lib/scoreTop3";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ slug: string }> };

export default async function ResultsPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: game } = await supabase.from("games").select("*").eq("slug", slug).maybeSingle();
  if (!game) notFound();
  const g = game as Game;

  const { data: picks } = await supabase.from("top3_picks").select("*").eq("game_id", g.id);
  const { data: profiles } = await supabase.from("profiles").select("*").eq("game_id", g.id);
  const { data: result } = await supabase.from("race_results").select("*").eq("game_id", g.id).maybeSingle();
  const { data: horses } = await supabase.from("horses").select("*").eq("game_id", g.id);

  const horseMap = new Map((horses as Horse[] | null)?.map((h) => [h.id, h]) ?? []);
  const profileByUser = new Map((profiles as Profile[] | null)?.map((p) => [p.user_id, p]) ?? []);

  const positions = (result?.positions as string[] | undefined) ?? [];
  const officialTop3 = positions
    .slice(0, 3)
    .map((id) => horseMap.get(id))
    .filter((h): h is Horse => h != null);

  const scored = ((picks ?? []) as Top3Pick[])
    .map((tp) => {
      const p = profileByUser.get(tp.user_id);
      const score = top3ExactScore(tp.pick_first, tp.pick_second, tp.pick_third, positions);
      return { tp, p, score };
    })
    .sort((a, b) => b.score - a.score);

  const showConfetti = g.status === "settled" && scored.some((s) => s.score === 3);

  return (
    <div className="space-y-8">
      <ConfettiCelebration fire={showConfetti} />
      <div>
        <h1 className="font-serif text-3xl font-bold text-[var(--foreground)]">Results</h1>
        <p className="text-sm text-[var(--derby-muted)]">
          {g.status === "settled"
            ? "Official finish vs. family picks."
            : "Race not entered yet. Someone with the Race office link can set the finish order."}
        </p>
      </div>

      {officialTop3.length > 0 && (
        <div className="rounded-3xl border border-[var(--derby-gold)]/35 bg-[var(--derby-forest)]/80 p-6 text-[var(--derby-cream)]">
          <h2 className="font-serif text-lg text-[var(--derby-gold)]">Official top 3</h2>
          <p className="mt-1 text-xs text-[var(--derby-muted)]">Horse numbers (post positions) and names.</p>
          <ol className="mt-4 list-none space-y-3">
            {officialTop3.map((h, idx) => {
              const fin = idx + 1;
              const label = fin === 1 ? "1st" : fin === 2 ? "2nd" : "3rd";
              return (
                <li key={h.id} className="flex items-center gap-3">
                  <span className="w-8 shrink-0 text-xs font-semibold uppercase tracking-wide text-[var(--derby-muted)]">
                    {label}
                  </span>
                  <HorseNumberCloth
                    n={h.post_position}
                    emphasis={fin === 1 ? "gold" : "muted"}
                    variant="onDark"
                    className="!min-h-10 !min-w-10"
                  />
                  <span className="min-w-0 font-medium leading-snug">{h.name}</span>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {g.status === "settled" && scored.length > 0 && (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="font-serif text-xl text-[var(--foreground)]">How everyone did</h2>
          <p className="mt-1 text-xs text-[var(--derby-muted)]">Score = exact 1st, 2nd, and 3rd matches (max 3).</p>
          <ul className="mt-4 space-y-3">
            {scored.map(({ tp, p, score }) => {
              const picks = [
                { id: tp.pick_first, place: 1 as const },
                { id: tp.pick_second, place: 2 as const },
                { id: tp.pick_third, place: 3 as const },
              ];
              return (
                <li
                  key={tp.id}
                  className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-[var(--foreground)]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">
                      {p?.avatar_emoji} {p?.display_name ?? "Player"}
                    </span>
                    <span className="text-[var(--derby-gold)]">
                      {score}/3 {score === 3 ? "Perfect!" : score === 2 ? "Nice!" : score === 1 ? "One hit!" : ""}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {picks.map(({ id, place }) => {
                      const h = horseMap.get(id);
                      return (
                        <span
                          key={id}
                          className="inline-flex min-w-0 max-w-full items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-2 py-1.5"
                        >
                          {h != null ? (
                            <HorseNumberCloth
                              n={h.post_position}
                              emphasis={place === 1 ? "gold" : "muted"}
                              className="!min-h-8 !min-w-8 !text-sm"
                            />
                          ) : (
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-dashed border-white/20 text-xs text-[var(--derby-muted)]">
                              ?
                            </span>
                          )}
                          <span className="truncate text-sm">{h?.name ?? "—"}</span>
                        </span>
                      );
                    })}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <Link href={`/g/${slug}/leaderboard`} className="inline-block text-[var(--derby-gold)]">
        ← See full pick grid
      </Link>
    </div>
  );
}
