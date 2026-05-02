"use client";

import type { Game, Horse } from "@/lib/database.types";
import { Reorder } from "framer-motion";
import { useMemo, useState } from "react";

export function AdminDashboard({ slug, initialGame, initialHorses }: { slug: string; initialGame: Game; initialHorses: Horse[] }) {
  const [game, setGame] = useState(initialGame);
  const [horses, setHorses] = useState(initialHorses);
  const [msg, setMsg] = useState<string | null>(null);

  const [finishOrder, setFinishOrder] = useState<string[]>(() =>
    [...initialHorses].sort((a, b) => a.post_position - b.post_position).map((h) => h.id),
  );

  const horseById = useMemo(() => new Map(horses.map((h) => [h.id, h])), [horses]);

  async function lock(locked: boolean) {
    setMsg(null);
    const r = await fetch(`/api/admin/${slug}/lock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locked }),
    });
    const j = await r.json();
    if (!r.ok) {
      setMsg(j.error ?? "Lock failed");
      return;
    }
    setGame(j as Game);
  }

  async function resetGame() {
    if (!confirm("Reset ALL bets and balances for this game?")) return;
    setMsg(null);
    const r = await fetch(`/api/admin/${slug}/reset`, { method: "POST" });
    const j = await r.json();
    if (!r.ok) {
      setMsg(j.error ?? "Reset failed");
      return;
    }
    setMsg("Reset complete. Reloading.");
    window.location.reload();
  }

  async function settle() {
    setMsg(null);
    const r = await fetch(`/api/admin/${slug}/settle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ positions: finishOrder }),
    });
    const j = await r.json();
    if (!r.ok) {
      setMsg(j.error ?? "Settle failed");
      return;
    }
    setMsg("Race results saved.");
    window.location.href = `/g/${slug}/results`;
  }

  async function refreshAi() {
    setMsg(null);
    const r = await fetch(`/api/predictions/refresh?slug=${encodeURIComponent(slug)}`, {
      method: "POST",
    });
    const j = await r.json();
    if (!r.ok) {
      setMsg(j.error ?? "Refresh failed");
      return;
    }
    setMsg("AI summary refreshed.");
  }

  async function saveHorse(h: Partial<Horse> & { id?: string }) {
    setMsg(null);
    const r = await fetch(`/api/admin/${slug}/horses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(h),
    });
    const j = await r.json();
    if (!r.ok) {
      setMsg(j.error ?? "Save horse failed");
      return;
    }
    setHorses((prev) => {
      const idx = prev.findIndex((x) => x.id === j.id);
      if (idx >= 0) {
        const n = [...prev];
        n[idx] = j as Horse;
        return n;
      }
      return [...prev, j as Horse];
    });
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-3xl font-bold text-[var(--foreground)]">Race office — {slug}</h1>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void lock(true)}
            className="rounded-xl border border-white/15 px-3 py-2 text-sm text-[var(--foreground)]"
          >
            Lock betting
          </button>
          <button
            type="button"
            onClick={() => void lock(false)}
            className="rounded-xl border border-white/15 px-3 py-2 text-sm text-[var(--foreground)]"
          >
            Unlock
          </button>
          <button
            type="button"
            onClick={() => void resetGame()}
            className="rounded-xl border border-rose-500/40 px-3 py-2 text-sm text-rose-300"
          >
            Reset game
          </button>
        </div>
      </div>
      <p className="text-sm text-[var(--derby-muted)]">Status: {game.status}</p>
      {msg && <p className="text-sm text-[var(--derby-gold)]">{msg}</p>}

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="font-serif text-xl text-[var(--foreground)]">Finish order</h2>
        <p className="text-xs text-[var(--derby-muted)]">
          Drag rows to reorder. Top = win. Used for exacta/trifecta + place/show.
        </p>
        <Reorder.Group
          axis="y"
          values={finishOrder}
          onReorder={setFinishOrder}
          className="mt-4 flex list-none flex-col gap-2 p-0"
          as="ol"
        >
          {finishOrder.map((id, idx) => {
            const h = horseById.get(id);
            if (!h) return null;
            return (
              <Reorder.Item
                key={id}
                value={id}
                as="li"
                className="relative flex cursor-grab touch-none items-center gap-3 rounded-2xl border border-white/10 bg-black/10 px-3 py-3 text-sm text-[var(--foreground)] shadow-sm active:cursor-grabbing"
                style={{ touchAction: "none" }}
              >
                <span className="shrink-0 text-[var(--derby-muted)]" title="Drag to reorder">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <circle cx="9" cy="6" r="1.75" />
                    <circle cx="15" cy="6" r="1.75" />
                    <circle cx="9" cy="12" r="1.75" />
                    <circle cx="15" cy="12" r="1.75" />
                    <circle cx="9" cy="18" r="1.75" />
                    <circle cx="15" cy="18" r="1.75" />
                  </svg>
                </span>
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--foreground)]/10 font-mono text-xs font-semibold tabular-nums text-[var(--derby-muted)]">
                  {idx + 1}
                </span>
                <span className="min-w-0 flex-1 font-medium">
                  {h.name}{" "}
                  <span className="font-normal text-[var(--derby-muted)]">(#{h.post_position})</span>
                </span>
              </Reorder.Item>
            );
          })}
        </Reorder.Group>
        <button
          type="button"
          onClick={() => void settle()}
          className="mt-4 w-full rounded-2xl bg-[var(--derby-gold)] py-3 font-semibold text-[var(--derby-forest)]"
        >
          Settle race with this order
        </button>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-serif text-xl text-[var(--foreground)]">Horses</h2>
          <button
            type="button"
            onClick={() => void refreshAi()}
            className="rounded-xl border border-white/15 px-3 py-1 text-xs text-[var(--foreground)]"
          >
            Refresh AI summary
          </button>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {horses.map((h) => (
            <HorseAdminRow key={h.id} horse={h} onSave={saveHorse} />
          ))}
        </div>
      </section>
    </div>
  );
}

function HorseAdminRow({ horse, onSave }: { horse: Horse; onSave: (h: Partial<Horse> & { id?: string }) => void }) {
  const [name, setName] = useState(horse.name);
  const [post, setPost] = useState(horse.post_position);
  const [num, setNum] = useState(horse.odds_num);
  const [den, setDen] = useState(horse.odds_den);
  const [scr, setScr] = useState(horse.scratched);
  const [jockey, setJockey] = useState(horse.jockey ?? "");
  const [trainer, setTrainer] = useState(horse.trainer ?? "");
  const [model, setModel] = useState(horse.model_win_prob ?? "");

  return (
    <div className="rounded-2xl border border-white/10 p-4 text-sm text-[var(--foreground)]">
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="block">
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded border border-white/15 bg-transparent px-2 py-1" />
        </label>
        <label className="block">
          Post #
          <input type="number" value={post} onChange={(e) => setPost(Number(e.target.value))} className="mt-1 w-full rounded border border-white/15 bg-transparent px-2 py-1" />
        </label>
        <label className="block">
          Odds num
          <input type="number" value={num} onChange={(e) => setNum(Number(e.target.value))} className="mt-1 w-full rounded border border-white/15 bg-transparent px-2 py-1" />
        </label>
        <label className="block">
          Odds den
          <input type="number" value={den} onChange={(e) => setDen(Number(e.target.value))} className="mt-1 w-full rounded border border-white/15 bg-transparent px-2 py-1" />
        </label>
        <label className="block sm:col-span-2">
          Jockey
          <input value={jockey} onChange={(e) => setJockey(e.target.value)} className="mt-1 w-full rounded border border-white/15 bg-transparent px-2 py-1" />
        </label>
        <label className="block sm:col-span-2">
          Trainer
          <input value={trainer} onChange={(e) => setTrainer(e.target.value)} className="mt-1 w-full rounded border border-white/15 bg-transparent px-2 py-1" />
        </label>
        <label className="block sm:col-span-2">
          Model win prob (0–1)
          <input value={model} onChange={(e) => setModel(e.target.value)} className="mt-1 w-full rounded border border-white/15 bg-transparent px-2 py-1" />
        </label>
        <label className="flex items-center gap-2 sm:col-span-2">
          <input type="checkbox" checked={scr} onChange={(e) => setScr(e.target.checked)} />
          Scratched
        </label>
      </div>
      <button
        type="button"
        className="mt-3 w-full rounded-xl bg-[var(--derby-forest)] py-2 text-[var(--derby-cream)]"
        onClick={() =>
          void onSave({
            id: horse.id,
            post_position: post,
            name,
            jockey,
            trainer,
            odds_num: num,
            odds_den: den,
            scratched: scr,
            model_win_prob: model === "" ? null : Number(model),
          })
        }
      >
        Save horse
      </button>
    </div>
  );
}
