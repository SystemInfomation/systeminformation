import { LeaderboardChart } from "@/components/LeaderboardChart";
import { createClient } from "@/lib/supabase/server";
import type { Bet, Game, Profile } from "@/lib/database.types";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ slug: string }> };

export default async function LeaderboardPage({ params }: Props) {
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

  const { data: bets } = await supabase.from("bets").select("*").eq("game_id", g.id);

  const list = (profiles ?? []) as Profile[];
  const betList = (bets ?? []) as Bet[];

  const winsByUser = new Map<string, number>();
  for (const b of betList) {
    if (b.status === "won") winsByUser.set(b.user_id, (winsByUser.get(b.user_id) ?? 0) + 1);
  }

  const rows = list.map((p) => {
    const roi =
      p.starting_balance > 0
        ? ((p.current_balance - p.starting_balance) / p.starting_balance) * 100
        : 0;
    return {
      name: `${p.avatar_emoji} ${p.display_name}`,
      balance: Number(p.current_balance),
      roi: Math.round(roi * 10) / 10,
      wins: winsByUser.get(p.user_id) ?? 0,
    };
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-bold text-[var(--foreground)]">Leaderboard</h1>
        <p className="text-sm text-[var(--derby-muted)]">Sorted by pretend bankroll. ROI is vs starting stack.</p>
      </div>

      <LeaderboardChart data={rows} />

      <div className="overflow-x-auto rounded-3xl border border-white/10">
        <table className="w-full text-left text-sm text-[var(--foreground)]">
          <thead className="bg-white/5 text-xs uppercase text-[var(--derby-muted)]">
            <tr>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Player</th>
              <th className="px-4 py-3">Bankroll</th>
              <th className="px-4 py-3">ROI %</th>
              <th className="px-4 py-3">Winning bets</th>
            </tr>
          </thead>
          <tbody>
            {list.map((p, i) => {
              const roi =
                p.starting_balance > 0
                  ? ((p.current_balance - p.starting_balance) / p.starting_balance) * 100
                  : 0;
              return (
                <tr key={p.id} className="border-t border-white/10">
                  <td className="px-4 py-3">{i + 1}</td>
                  <td className="px-4 py-3 font-medium">
                    <span className="mr-2">{p.avatar_emoji}</span>
                    {p.display_name}
                    {i === 0 && <span className="ml-2 text-[var(--derby-gold)]">🏆</span>}
                  </td>
                  <td className="px-4 py-3 font-mono">${Number(p.current_balance).toFixed(0)}</td>
                  <td className="px-4 py-3">{roi.toFixed(1)}%</td>
                  <td className="px-4 py-3">{winsByUser.get(p.user_id) ?? 0}</td>
                </tr>
              );
            })}
            {!list.length && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-[var(--derby-muted)]">
                  No players yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
