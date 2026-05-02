import { Countdown } from "@/components/Countdown";
import { createClient } from "@/lib/supabase/server";
import type { Game } from "@/lib/database.types";
import Link from "next/link";

const DEFAULT_SLUG = "derby-2026";

export default async function HomePage() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return (
      <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-6 text-center">
        <h1 className="font-serif text-2xl font-semibold">Configure Supabase</h1>
        <p className="mt-2 text-sm opacity-90">
          Add your keys to <code className="rounded bg-black/30 px-1">.env.local</code>.
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
          No game for <strong>{DEFAULT_SLUG}</strong>. Run the SQL migrations in Supabase, then refresh.
        </p>
      </div>
    );
  }

  const g = game as Game;
  let pickCount: number | null = null;
  const { count, error: countErr } = await supabase
    .from("top3_picks")
    .select("*", { count: "exact", head: true })
    .eq("game_id", g.id);
  if (!countErr && count !== null) pickCount = count;

  const ai = (g.ai_summary ?? {}) as Record<string, unknown>;

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-3xl border border-[var(--derby-gold)]/35 bg-[var(--derby-forest)] p-8 text-[var(--derby-cream)] shadow-2xl">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[var(--derby-gold)]/10 blur-3xl" />
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--derby-gold)]">{g.name}</p>
        <h1 className="mt-2 font-serif text-4xl font-bold sm:text-5xl">
          Pick your <span className="text-[var(--derby-gold)]">top 3</span>
        </h1>
        <p className="mt-3 max-w-xl text-base text-[var(--derby-muted)]">
          Enter your name and the three horses you think will finish 1st, 2nd, and 3rd. That&apos;s it — no money,
          no odds homework, just family fun.
        </p>
        <div className="mt-8 max-w-xl">
          <Countdown targetIso={g.race_start_at} />
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={`/g/${DEFAULT_SLUG}/pick`}
            className="rounded-2xl bg-[var(--derby-gold)] px-8 py-4 text-base font-bold text-[var(--derby-forest)]"
          >
            Make my picks
          </Link>
          <Link
            href={`/g/${DEFAULT_SLUG}/leaderboard`}
            className="rounded-2xl border border-[var(--derby-gold)]/50 px-6 py-4 text-base font-semibold text-[var(--derby-cream)]"
          >
            See everyone&apos;s picks
          </Link>
        </div>
        {pickCount !== null && (
          <p className="mt-4 text-sm text-[var(--derby-muted)]">
            {pickCount} {pickCount === 1 ? "person has" : "people have"} submitted picks.
          </p>
        )}
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 dark:bg-black/20">
        <h2 className="font-serif text-xl text-[var(--foreground)]">Fun facts (optional)</h2>
        <ul className="mt-4 space-y-2 text-sm text-[var(--foreground)]">
          <li>
            <span className="text-[var(--derby-gold)]">Buzz pick:</span> {String(ai.topWinner ?? "—")}
          </li>
          <li>
            <span className="text-[var(--derby-gold)]">Long shot:</span> {String(ai.sleeper ?? "—")}
          </li>
        </ul>
      </section>
    </div>
  );
}
