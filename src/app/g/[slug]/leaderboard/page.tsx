import { LeaderboardTable } from "@/components/LeaderboardTable";
import { buildLeaderboardRows } from "@/lib/leaderboardRows";
import { createClient } from "@/lib/supabase/server";
import type { Game } from "@/lib/database.types";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ slug: string }> };

export default async function LeaderboardPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: game } = await supabase.from("games").select("*").eq("slug", slug).maybeSingle();
  if (!game) notFound();
  const g = game as Game;

  const { rows, settled } = await buildLeaderboardRows(supabase, g);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-2xl font-bold text-[var(--foreground)] sm:text-3xl">Everyone&apos;s top 3</h1>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-[var(--derby-muted)]">
          {settled
            ? "Sorted by how many places you nailed (1st→1st, 2nd→2nd, 3rd→3rd)."
            : "After the race is entered in Race office, scores show up here."}
        </p>
      </div>

      <LeaderboardTable slug={slug} settled={settled} initialRows={rows} />
    </div>
  );
}
