"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminUnlockGate({ slug }: { slug: string }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const r = await fetch("/api/admin/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, code: code.trim() }),
      });
      const j = await r.json();
      if (!r.ok) {
        setErr(j.error ?? "Could not unlock");
        setLoading(false);
        return;
      }
      router.refresh();
    } catch {
      setErr("Network error");
    }
    setLoading(false);
  }

  return (
    <div className="mx-auto max-w-md space-y-6 rounded-3xl border border-[var(--derby-gold)]/35 bg-[var(--derby-forest)]/90 p-8 text-[var(--derby-cream)] shadow-xl">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--derby-gold)]">Race office</p>
        <h1 className="mt-2 font-serif text-2xl font-bold">Locked</h1>
        <p className="mt-2 text-sm text-[var(--derby-muted)]">
          Enter the family code to manage <span className="text-[var(--derby-cream)]">{slug}</span>.
        </p>
      </div>

      <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
        <label className="block text-sm">
          <span className="text-[var(--derby-muted)]">Code</span>
          <input
            type="password"
            inputMode="numeric"
            autoComplete="off"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-3 text-lg tracking-widest text-[var(--derby-cream)] placeholder:text-[var(--derby-muted)]/50"
            placeholder="••••"
            maxLength={32}
            autoFocus
          />
        </label>
        {err && <p className="text-sm text-rose-300">{err}</p>}
        <button
          type="submit"
          disabled={loading || !code.trim()}
          className="w-full rounded-2xl bg-[var(--derby-gold)] py-3.5 text-base font-bold text-[var(--derby-forest)] disabled:opacity-40"
        >
          {loading ? "Checking…" : "Unlock"}
        </button>
      </form>

      <p className="text-center text-xs text-[var(--derby-muted)]">
        <Link href="/" className="text-[var(--derby-gold)] underline-offset-2 hover:underline">
          ← Back to home
        </Link>
      </p>
    </div>
  );
}
