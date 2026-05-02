import { Top3PickForm } from "@/components/Top3PickForm";
import { createClient } from "@/lib/supabase/server";
import type { Game, Horse, Profile, Top3Pick } from "@/lib/database.types";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ slug: string }> };

export default async function PickPage({ params }: Props) {
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
  let existingPick: Top3Pick | null = null;
  if (user) {
    const { data: p } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .eq("game_id", g.id)
      .maybeSingle();
    profile = (p as Profile) ?? null;
    const { data: pick } = await supabase
      .from("top3_picks")
      .select("*")
      .eq("user_id", user.id)
      .eq("game_id", g.id)
      .maybeSingle();
    existingPick = (pick as Top3Pick) ?? null;
  }

  return (
    <div className="space-y-6">
      <Top3PickForm slug={slug} game={g} horses={(horses ?? []) as Horse[]} profile={profile} existingPick={existingPick} />
    </div>
  );
}
