import { AdminDashboard } from "@/components/AdminDashboard";
import { createClient } from "@/lib/supabase/server";
import type { Game, Horse } from "@/lib/database.types";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ slug: string }> };

export default async function AdminPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: game } = await supabase.from("games").select("*").eq("slug", slug).maybeSingle();
  if (!game) notFound();

  const { data: horses } = await supabase
    .from("horses")
    .select("*")
    .eq("game_id", game.id)
    .order("post_position");

  return <AdminDashboard slug={slug} initialGame={game as Game} initialHorses={(horses ?? []) as Horse[]} />;
}
