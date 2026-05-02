import { BettingClient } from "@/components/BettingClient";
import { createClient } from "@/lib/supabase/server";
import type { Game, Horse, Profile } from "@/lib/database.types";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ slug: string }> };

export default async function BetPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: game } = await supabase.from("games").select("*").eq("slug", slug).maybeSingle();
  if (!game) notFound();
  const g = game as Game;

  const { data: horses } = await supabase
    .from("horses")
    .select("*")
    .eq("game_id", g.id)
    .order("post_position");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: Profile | null = null;
  if (user) {
    const { data: p } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .eq("game_id", g.id)
      .maybeSingle();
    profile = (p as Profile) ?? null;
  }

  return <BettingClient game={g} horses={(horses ?? []) as Horse[]} profile={profile} />;
}
