"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function JoinForm({
  slug,
  gameId,
  startingBalance,
}: {
  slug: string;
  gameId: string;
  startingBalance: number;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🐎");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const display = name.trim();
    if (display.length < 2) {
      setErr("Pick a name with at least 2 characters.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { data: auth, error: aErr } = await supabase.auth.signInAnonymously();
    if (aErr || !auth.user) {
      setLoading(false);
      setErr(aErr?.message ?? "Could not start session. Enable Anonymous sign-ins in Supabase.");
      return;
    }
    const uid = auth.user.id;
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", uid)
      .eq("game_id", gameId)
      .maybeSingle();
    if (existing) {
      setLoading(false);
      router.push(`/g/${slug}/bet`);
      router.refresh();
      return;
    }
    const { error: pErr } = await supabase.from("profiles").insert({
      user_id: uid,
      game_id: gameId,
      display_name: display,
      starting_balance: startingBalance,
      current_balance: startingBalance,
      avatar_emoji: emoji.slice(0, 8),
    });
    setLoading(false);
    if (pErr) {
      if (pErr.code === "23505") {
        setErr("That name is taken in this game — try a different nickname.");
      } else {
        setErr(pErr.message);
      }
      return;
    }
    router.push(`/g/${slug}/bet`);
    router.refresh();
  }

  return (
    <form
      onSubmit={(e) => void onSubmit(e)}
      className="space-y-4 rounded-3xl border border-[var(--derby-gold)]/35 bg-[var(--derby-forest)]/80 p-6 text-[var(--derby-cream)]"
    >
      <label className="block text-sm">
        <span className="text-[var(--derby-muted)]">Display name</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-[var(--derby-cream)]"
          placeholder="James, Mom, Papa Bear…"
          autoComplete="off"
        />
      </label>
      <label className="block text-sm">
        <span className="text-[var(--derby-muted)]">Avatar emoji</span>
        <input
          value={emoji}
          onChange={(e) => setEmoji(e.target.value)}
          className="mt-1 w-full rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-[var(--derby-cream)]"
        />
      </label>
      {err && <p className="text-sm text-rose-300">{err}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-2xl bg-[var(--derby-gold)] py-3 font-semibold text-[var(--derby-forest)] disabled:opacity-50"
      >
        {loading ? "Joining…" : "Shuffle me in"}
      </button>
    </form>
  );
}
