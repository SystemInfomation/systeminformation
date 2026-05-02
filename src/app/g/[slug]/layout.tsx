import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Props = { children: React.ReactNode; params: Promise<{ slug: string }> };

export default async function GameLayout({ children, params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: game } = await supabase.from("games").select("slug,name,status").eq("slug", slug).maybeSingle();
  if (!game) notFound();

  return (
    <div className="space-y-4">
      <nav className="flex flex-wrap gap-2 text-sm">
        <Link
          href={`/g/${slug}/bet`}
          className="rounded-full border border-white/15 px-3 py-1 text-[var(--foreground)] hover:border-[var(--derby-gold)]"
        >
          Bet
        </Link>
        <Link
          href={`/g/${slug}/leaderboard`}
          className="rounded-full border border-white/15 px-3 py-1 text-[var(--foreground)] hover:border-[var(--derby-gold)]"
        >
          Leaderboard
        </Link>
        <Link
          href={`/g/${slug}/results`}
          className="rounded-full border border-white/15 px-3 py-1 text-[var(--foreground)] hover:border-[var(--derby-gold)]"
        >
          Results
        </Link>
        <span className="ml-auto rounded-full bg-white/5 px-3 py-1 text-xs text-[var(--derby-muted)]">
          {game.status === "open" ? "Betting open" : game.status === "locked" ? "Locked" : "Settled"}
        </span>
      </nav>
      {children}
    </div>
  );
}
