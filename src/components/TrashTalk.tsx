"use client";

import { createClient } from "@/lib/supabase/client";
import type { Message, Profile } from "@/lib/database.types";
import { useEffect, useState } from "react";

export function TrashTalk({ gameId, profile }: { gameId: string; profile: Profile | null }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    void (async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("game_id", gameId)
        .order("created_at", { ascending: true })
        .limit(80);
      if (!cancelled && data) setMessages(data as Message[]);
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .eq("game_id", gameId);
      if (!cancelled && profs) {
        const m: Record<string, string> = {};
        for (const p of profs as { user_id: string; display_name: string }[]) {
          m[p.user_id] = p.display_name;
        }
        setNames(m);
      }
    })();

    const channel = supabase
      .channel(`messages:${gameId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `game_id=eq.${gameId}` },
        (payload) => {
          const row = payload.new as Message;
          setMessages((m) => [...m, row].slice(-80));
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [gameId]);

  async function send() {
    setError(null);
    if (!profile || !body.trim()) return;
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) {
      setError("Sign in first (Join page).");
      return;
    }
    const { error: e } = await supabase.from("messages").insert({
      game_id: gameId,
      user_id: uid,
      body: body.trim().slice(0, 280),
    });
    if (e) setError(e.message);
    else setBody("");
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <h3 className="font-serif text-lg text-[var(--derby-cream)]">Family chatter</h3>
      <p className="text-xs text-[var(--derby-muted)]">Keep it kind — it&apos;s a party.</p>
      <div className="mt-3 max-h-48 space-y-2 overflow-y-auto text-sm">
        {messages.length === 0 && (
          <p className="text-[var(--derby-muted)]">No messages yet. Break the ice.</p>
        )}
        {messages.map((m) => (
          <div key={m.id} className="rounded-lg bg-white/5 px-3 py-2 text-[var(--derby-cream)]">
            <span className="text-[var(--derby-gold)]">
              {profile?.user_id === m.user_id ? "You" : names[m.user_id] ?? "Family"}:
            </span>{" "}
            {m.body}
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={profile ? "Friendly trash talk…" : "Join to chat"}
          disabled={!profile}
          className="flex-1 rounded-xl border border-white/15 bg-[var(--derby-forest)] px-3 py-2 text-sm text-[var(--derby-cream)] placeholder:text-[var(--derby-muted)]"
        />
        <button
          type="button"
          onClick={() => void send()}
          disabled={!profile}
          className="rounded-xl bg-[var(--derby-gold)] px-4 py-2 text-sm font-semibold text-[var(--derby-forest)] disabled:opacity-40"
        >
          Send
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-rose-300">{error}</p>}
    </div>
  );
}
