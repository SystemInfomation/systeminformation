"use client";

import { createClient } from "@/lib/supabase/client";
import type { Game, Horse, Profile, Top3Pick } from "@/lib/database.types";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export function Top3PickForm({
  slug,
  game,
  horses,
  profile,
  existingPick,
}: {
  slug: string;
  game: Game;
  horses: Horse[];
  profile: Profile | null;
  existingPick: Top3Pick | null;
}) {
  const router = useRouter();
  const active = useMemo(() => horses.filter((h) => !h.scratched).sort((a, b) => a.post_position - b.post_position), [horses]);

  const [name, setName] = useState(profile?.display_name ?? "");
  const [first, setFirst] = useState(existingPick?.pick_first ?? "");
  const [second, setSecond] = useState(existingPick?.pick_second ?? "");
  const [third, setThird] = useState(existingPick?.pick_third ?? "");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const locked = game.status !== "open";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const display = name.trim();
    if (display.length < 2) {
      setErr("Enter your name (at least 2 characters).");
      return;
    }
    if (!first || !second || !third) {
      setErr("Choose a horse for 1st, 2nd, and 3rd.");
      return;
    }
    if (new Set([first, second, third]).size !== 3) {
      setErr("Pick three different horses.");
      return;
    }
    if (locked) {
      setErr("Picks are locked.");
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

    const { data: existingProf } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", uid)
      .eq("game_id", game.id)
      .maybeSingle();

    if (!existingProf) {
      const { error: pErr } = await supabase.from("profiles").insert({
        user_id: uid,
        game_id: game.id,
        display_name: display,
        starting_balance: 0,
        current_balance: 0,
        avatar_emoji: "🐎",
      });
      if (pErr) {
        setLoading(false);
        if (pErr.code === "23505") {
          setErr("That name is already taken — try another.");
        } else {
          setErr(pErr.message);
        }
        return;
      }
    } else {
      await supabase.from("profiles").update({ display_name: display }).eq("user_id", uid).eq("game_id", game.id);
    }

    const row = {
      game_id: game.id,
      user_id: uid,
      pick_first: first,
      pick_second: second,
      pick_third: third,
      updated_at: new Date().toISOString(),
    };

    const { error: pickErr } = await supabase.from("top3_picks").upsert(row, { onConflict: "game_id,user_id" });
    setLoading(false);
    if (pickErr) {
      setErr(pickErr.message);
      return;
    }
    router.push(`/g/${slug}/leaderboard`);
    router.refresh();
  }

  return (
    <form
      onSubmit={(e) => void onSubmit(e)}
      className="mx-auto max-w-lg space-y-6 rounded-3xl border border-[var(--derby-gold)]/35 bg-[var(--derby-forest)]/85 p-6 text-[var(--derby-cream)] shadow-xl"
    >
      <div>
        <h1 className="font-serif text-2xl font-bold text-[var(--derby-cream)]">Your picks</h1>
        <p className="mt-1 text-sm text-[var(--derby-muted)]">
          Your name and the three horses you think will finish 1st, 2nd, and 3rd. No money, no chips — just fun.
        </p>
      </div>

      <label className="block text-sm">
        <span className="text-[var(--derby-muted)]">Your name</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-3 text-lg text-[var(--derby-cream)]"
          placeholder="Grandma, Alex, Coach…"
          autoComplete="off"
          disabled={locked}
        />
      </label>

      <div className="space-y-4">
        {[
          { label: "1st place", value: first, set: setFirst },
          { label: "2nd place", value: second, set: setSecond },
          { label: "3rd place", value: third, set: setThird },
        ].map((slot) => (
          <label key={slot.label} className="block text-sm">
            <span className="font-medium text-[var(--derby-gold)]">{slot.label}</span>
            <select
              value={slot.value}
              onChange={(e) => slot.set(e.target.value)}
              disabled={locked}
              className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-3 text-[var(--derby-cream)]"
            >
              <option value="">Choose a horse…</option>
              {active.map((h) => (
                <option key={h.id} value={h.id}>
                  #{h.post_position} {h.name}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>

      {err && <p className="text-sm text-rose-300">{err}</p>}

      <button
        type="submit"
        disabled={loading || locked}
        className="w-full rounded-2xl bg-[var(--derby-gold)] py-4 text-base font-bold text-[var(--derby-forest)] disabled:opacity-40"
      >
        {locked ? "Picks are locked" : loading ? "Saving…" : existingPick ? "Update my picks" : "Save my top 3"}
      </button>
    </form>
  );
}
