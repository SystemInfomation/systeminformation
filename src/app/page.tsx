import { Countdown } from "@/components/Countdown";
import { createClient } from "@/lib/supabase/server";
import type { Game, Horse, Profile } from "@/lib/database.types";
import { impliedWinProb } from "@/lib/payouts";
import Link from "next/link";

const DEFAULT_SLUG = "derby-2026";

export default async function HomePage() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return (
      <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-6 text-center">
        <h1 className="font-serif text-2xl font-semibold">Configure Supabase</h1>
        <p className="mt-2 text-sm opacity-90">
          Copy <code className="rounded bg-black/30 px-1">.env.local.example</code> to{" "}
          <code className="rounded bg-black/30 px-1">.env.local</code> and add your project keys.
        </p>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: game } = await supabase
    .from("games")
    .select("*")
    .eq("slug", DEFAULT_SLUG)
    .maybeSingle();

  if (!game) {
    return (
      <div className="space-y-4 text-center">
        <h1 className="font-serif text-3xl font-bold text-[var(--derby-gold)]">Derby Family</h1>
        <p className="text-[var(--derby-muted)]">
          No game row for <strong>{DEFAULT_SLUG}</strong>. Run the SQL migration in Supabase, then refresh.
        </p>
      </div>
    );
  }

  const g = game as Game;
  const { data: horses } = await supabase
    .from("horses")
    .select("*")
    .eq("game_id", g.id)
    .eq("scratched", false)
    .order("post_position");

  const { data: leaders } = await supabase
    .from("profiles")
    .select("*")
    .eq("game_id", g.id)
    .order("current_balance", { ascending: false })
    .limit(5);

  const hs = (horses ?? []) as Horse[];
  const topPred = [...hs].sort(
    (a, b) => impliedWinProb(b.odds_num, b.odds_den) - impliedWinProb(a.odds_num, a.odds_den),
  );

  const ai = (g.ai_summary ?? {}) as Record<string, unknown>;

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-3xl border border-[var(--derby-gold)]/35 bg-[var(--derby-forest)] p-8 text-[var(--derby-cream)] shadow-2xl dark:bg-[var(--derby-forest)]">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[var(--derby-gold)]/10 blur-3xl" />
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--derby-gold)]">
          {g.name}
        </p>
        <h1 className="mt-2 font-serif text-4xl font-bold sm:text-5xl">
          The family derby <span className="text-[var(--derby-gold)]">board</span>
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-[var(--derby-muted)]">
          Pretend chips, real bragging rights. Lock your silliest hat, grab a mint julep (any age: lemonade),
          and run the numbers.
        </p>
        <div className="mt-8 max-w-xl">
          <Countdown targetIso={g.race_start_at} />
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={`/join/${DEFAULT_SLUG}`}
            className="rounded-2xl bg-[var(--derby-gold)] px-6 py-3 text-sm font-bold text-[var(--derby-forest)]"
          >
            Join the table
          </Link>
          <Link
            href={`/g/${DEFAULT_SLUG}/bet`}
            className="rounded-2xl border border-[var(--derby-gold)]/50 px-6 py-3 text-sm font-semibold text-[var(--derby-cream)]"
          >
            Place your bets
          </Link>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur dark:bg-black/20">
          <h2 className="font-serif text-xl text-[var(--foreground)]">AI board (cached)</h2>
          <ul className="mt-4 space-y-2 text-sm text-[var(--foreground)]">
            <li>
              <span className="text-[var(--derby-gold)]">Top pick:</span> {String(ai.topWinner ?? "—")}
            </li>
            <li>
              <span className="text-[var(--derby-gold)]">Sleeper:</span> {String(ai.sleeper ?? "—")}
            </li>
            <li>
              <span className="text-[var(--derby-gold)]">Overrated:</span> {String(ai.overrated ?? "—")}
            </li>
            <li>
              <span className="text-[var(--derby-gold)]">Dark horse:</span> {String(ai.darkHorse ?? "—")}
            </li>
          </ul>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur dark:bg-black/20">
          <h2 className="font-serif text-xl text-[var(--foreground)]">Market favorites (by implied win %)</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-[var(--foreground)]">
            {topPred.slice(0, 5).map((h) => (
              <li key={h.id}>
                <strong>{h.name}</strong>{" "}
                <span className="opacity-70">
                  ({h.odds_num}/{h.odds_den}) ~{(impliedWinProb(h.odds_num, h.odds_den) * 100).toFixed(1)}%
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur dark:bg-black/20">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-serif text-xl text-[var(--foreground)]">Leaderboard preview</h2>
          <Link href={`/g/${DEFAULT_SLUG}/leaderboard`} className="text-sm text-[var(--derby-gold)]">
            Full board →
          </Link>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(leaders as Profile[] | null)?.map((p, i) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/10 px-4 py-3"
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{p.avatar_emoji}</span>
                <div>
                  <div className="font-medium text-[var(--foreground)]">{p.display_name}</div>
                  <div className="text-xs text-[var(--derby-muted)]">#{i + 1} in the house</div>
                </div>
              </div>
              <div className="font-mono text-[var(--derby-gold)]">${p.current_balance.toFixed(0)}</div>
            </div>
          ))}
          {!leaders?.length && (
            <p className="text-sm text-[var(--derby-muted)]">No players yet — be the first to join.</p>
          )}
        </div>
      </section>
    </div>
  );
}
