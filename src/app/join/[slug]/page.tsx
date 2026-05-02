import { JoinForm } from "@/components/JoinForm";
import { createClient } from "@/lib/supabase/server";
import type { Game } from "@/lib/database.types";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ slug: string }> };

export default async function JoinPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: game } = await supabase.from("games").select("*").eq("slug", slug).maybeSingle();
  if (!game) notFound();
  const g = game as Game;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-[var(--foreground)]">Join {g.name}</h1>
        <p className="mt-2 text-sm text-[var(--derby-muted)]">
          Pick a family nickname. We&apos;ll give you <strong>${g.starting_balance}</strong> in pretend chips.
        </p>
      </div>
      <JoinForm slug={slug} gameId={g.id} startingBalance={g.starting_balance} />
      <p className="text-center text-sm text-[var(--derby-muted)]">
        Already in?{" "}
        <Link href={`/g/${slug}/bet`} className="text-[var(--derby-gold)]">
          Go bet
        </Link>
      </p>
    </div>
  );
}
