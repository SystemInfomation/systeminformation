import { createClient } from "@/lib/supabase/server";
import type { Game, Horse, Profile, Top3Pick } from "@/lib/database.types";
import { top3ExactScore } from "@/lib/scoreTop3";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ slug: string }> };

export default async function LeaderboardPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: game } = await supabase.from("games").select("*").eq("slug", slug).maybeSingle();
  if (!game) notFound();
  const g = game as Game;

  const { data: picks } = await supabase.from("top3_picks").select("*").eq("game_id", g.id);
  const { data: profiles } = await supabase.from("profiles").select("*").eq("game_id", g.id);
  const { data: horses } = await supabase.from("horses").select("*").eq("game_id", g.id);
  const { data: result } = await supabase.from("race_results").select("*").eq("game_id", g.id).maybeSingle();

  const horseMap = new Map((horses as Horse[] | null)?.map((h) => [h.id, h]) ?? []);
  const profileByUser = new Map((profiles as Profile[] | null)?.map((p) => [p.user_id, p]) ?? []);
  const positions = (result?.positions as string[] | undefined) ?? [];
  const settled = g.status === "settled" && positions.length >= 3;

  const rows = ((picks ?? []) as Top3Pick[]).map((tp) => {
    const p = profileByUser.get(tp.user_id);
    const score = settled ? top3ExactScore(tp.pick_first, tp.pick_second, tp.pick_third, positions) : null;
    return {
      tp,
      name: p?.display_name ?? "Player",
      emoji: p?.avatar_emoji ?? "🐎",
      h1: horseMap.get(tp.pick_first)?.name ?? "—",
      h2: horseMap.get(tp.pick_second)?.name ?? "—",
      h3: horseMap.get(tp.pick_third)?.name ?? "—",
      score,
    };
  });

  rows.sort((a, b) => {
    if (a.score != null && b.score != null && b.score !== a.score) return b.score - a.score;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-bold text-[var(--foreground)]">Everyone&apos;s top 3</h1>
        <p className="text-sm text-[var(--derby-muted)]">
          {settled
            ? "Sorted by how many places you nailed (1st→1st, 2nd→2nd, 3rd→3rd)."
            : "After the race is entered in Race office, scores show up here."}
        </p>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-white/10">
        <table className="w-full text-left text-sm text-[var(--foreground)]">
          <thead className="bg-white/5 text-xs uppercase text-[var(--derby-muted)]">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">1st pick</th>
              <th className="px-4 py-3">2nd pick</th>
              <th className="px-4 py-3">3rd pick</th>
              {settled && <th className="px-4 py-3">Score</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.tp.id} className="border-t border-white/10">
                <td className="px-4 py-3 font-medium">
                  <span className="mr-1">{r.emoji}</span>
                  {r.name}
                </td>
                <td className="px-4 py-3">{r.h1}</td>
                <td className="px-4 py-3">{r.h2}</td>
                <td className="px-4 py-3">{r.h3}</td>
                {settled && (
                  <td className="px-4 py-3 font-mono text-[var(--derby-gold)]">
                    {r.score}/3 {r.score === 3 ? "🎯" : ""}
                  </td>
                )}
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={settled ? 5 : 4} className="px-4 py-8 text-center text-[var(--derby-muted)]">
                  No picks yet.{" "}
                  <Link href={`/g/${slug}/pick`} className="text-[var(--derby-gold)]">
                    Be the first
                  </Link>
                  .
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
