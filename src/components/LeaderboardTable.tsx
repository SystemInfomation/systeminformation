"use client";

import { HorseNumberCloth } from "@/components/HorseNumberCloth";
import type { LeaderboardRow } from "@/lib/leaderboardRows";
import Link from "next/link";
import { useEffect, useState } from "react";

function ScoreDots({ score }: { score: number | null }) {
  const s = score ?? 0;
  return (
    <div className="flex gap-1.5" aria-label={`Score ${s} of 3`}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={`h-2.5 w-2.5 rounded-full transition-colors ${
            i < s ? "bg-[var(--derby-gold)] shadow-[0_0_8px_rgba(201,162,39,0.5)]" : "bg-[var(--foreground)]/15"
          }`}
        />
      ))}
    </div>
  );
}

function RankBadge({ index, settled }: { index: number; settled: boolean }) {
  if (settled && index < 3) {
    const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉";
    return (
      <span className="flex h-9 w-9 shrink-0 items-center justify-center text-xl leading-none" aria-hidden>
        {medal}
      </span>
    );
  }
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--foreground)]/8 font-mono text-sm font-semibold text-[var(--derby-muted)] tabular-nums">
      {index + 1}
    </span>
  );
}

function PickLane({
  place,
  label,
  name,
  post,
}: {
  place: 1 | 2 | 3;
  label: string;
  name: string;
  post: number | null;
}) {
  const ring =
    place === 1
      ? "border-[var(--derby-gold)]/35 bg-[var(--derby-gold)]/12"
      : place === 2
        ? "border-[var(--foreground)]/15 bg-[var(--foreground)]/5"
        : "border-[var(--foreground)]/12 bg-[var(--foreground)]/4";

  return (
    <div className={`flex min-w-0 items-center gap-2.5 rounded-2xl border px-3 py-2.5 sm:gap-3 sm:px-3.5 sm:py-3 ${ring}`}>
      {post != null ? (
        <HorseNumberCloth n={post} emphasis={place === 1 ? "gold" : "muted"} />
      ) : (
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
            place === 1
              ? "bg-[var(--derby-gold)] text-[var(--derby-forest)]"
              : "bg-[var(--foreground)]/12 text-[var(--foreground)]"
          }`}
          aria-hidden
        >
          {place}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-[var(--derby-muted)]">{label}</p>
        <p className="truncate text-sm font-medium leading-snug text-[var(--foreground)] sm:text-base">{name}</p>
      </div>
    </div>
  );
}

function HorseCell({ post, name }: { post: number | null; name: string }) {
  return (
    <div className="flex max-w-[200px] min-w-0 items-center gap-2.5">
      {post != null ? (
        <HorseNumberCloth n={post} emphasis="gold" className="sm:min-h-11 sm:min-w-11" />
      ) : (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-[var(--foreground)]/20 text-xs text-[var(--derby-muted)]">
          —
        </span>
      )}
      <div className="min-w-0 flex-1">
        <span className="block truncate text-[var(--foreground)]/90">{name}</span>
      </div>
    </div>
  );
}

export function LeaderboardTable({
  slug,
  settled,
  initialRows,
}: {
  slug: string;
  settled: boolean;
  initialRows: LeaderboardRow[];
}) {
  const [rows, setRows] = useState(initialRows);
  const [liveSettled, setLiveSettled] = useState(settled);

  useEffect(() => {
    setRows(initialRows);
  }, [initialRows]);

  useEffect(() => {
    setLiveSettled(settled);
  }, [settled]);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const r = await fetch(`/api/g/${encodeURIComponent(slug)}/leaderboard`, { cache: "no-store" });
        if (!r.ok) return;
        const j = (await r.json()) as { rows?: LeaderboardRow[]; settled?: boolean };
        if (cancelled || !Array.isArray(j.rows)) return;
        setRows(j.rows);
        if (typeof j.settled === "boolean") setLiveSettled(j.settled);
      } catch {
        /* network / auth — keep last good rows */
      }
    }

    void poll();
    const id = setInterval(poll, 5000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [slug]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <p className="text-xs text-[var(--derby-muted)]" aria-live="polite">
          <span className="relative inline-flex h-2 w-2 align-middle">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--derby-gold)] opacity-40" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--derby-gold)]" />
          </span>{" "}
          <span className="ml-1.5">Live · updates every 5s</span>
        </p>
      </div>

      {/* Desktop: richer table */}
      <div className="hidden overflow-hidden rounded-3xl border border-[var(--foreground)]/10 bg-[var(--foreground)]/[0.03] shadow-[0_20px_50px_-24px_rgba(13,59,44,0.45)] md:block dark:shadow-[0_20px_50px_-24px_rgba(0,0,0,0.5)]">
        <table className="w-full text-left text-sm text-[var(--foreground)]">
          <thead className="border-b border-[var(--foreground)]/10 bg-[var(--foreground)]/[0.06] text-xs uppercase tracking-wide text-[var(--derby-muted)]">
            <tr>
              <th className="px-4 py-3.5 font-semibold">#</th>
              <th className="px-4 py-3.5 font-semibold">Player</th>
              <th className="px-4 py-3.5 font-semibold">1st · #</th>
              <th className="px-4 py-3.5 font-semibold">2nd · #</th>
              <th className="px-4 py-3.5 font-semibold">3rd · #</th>
              {liveSettled && <th className="px-4 py-3.5 font-semibold">Match</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={r.id}
                className={`border-t border-[var(--foreground)]/8 transition-colors hover:bg-[var(--foreground)]/[0.04] ${
                  liveSettled && i === 0 ? "bg-[var(--derby-gold)]/[0.07]" : ""
                }`}
              >
                <td className="px-4 py-3.5 align-middle">
                  <RankBadge index={i} settled={liveSettled} />
                </td>
                <td className="px-4 py-3.5 align-middle">
                  <div className="flex items-center gap-2">
                    <span className="text-lg" aria-hidden>
                      {r.emoji}
                    </span>
                    <span className="font-medium">{r.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5 align-middle">
                  <HorseCell post={r.post1} name={r.h1} />
                </td>
                <td className="px-4 py-3.5 align-middle">
                  <HorseCell post={r.post2} name={r.h2} />
                </td>
                <td className="px-4 py-3.5 align-middle">
                  <HorseCell post={r.post3} name={r.h3} />
                </td>
                {liveSettled && (
                  <td className="px-4 py-3.5 align-middle">
                    <div className="flex flex-col gap-1.5">
                      <span className="font-mono text-[var(--derby-gold)]">
                        {r.score}/3{r.score === 3 ? " 🎯" : ""}
                      </span>
                      <ScoreDots score={r.score} />
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={liveSettled ? 7 : 6} className="px-4 py-12 text-center text-[var(--derby-muted)]">
                  No picks yet.{" "}
                  <Link href={`/g/${slug}/pick`} className="font-medium text-[var(--derby-gold)] underline-offset-2 hover:underline">
                    Be the first
                  </Link>
                  .
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile + small tablet: cards */}
      <ul className="flex flex-col gap-3 md:hidden">
        {rows.map((r, i) => (
          <li
            key={r.id}
            className={`list-none rounded-3xl border border-[var(--foreground)]/12 bg-[var(--foreground)]/[0.04] p-4 shadow-[0_16px_40px_-20px_rgba(13,59,44,0.35)] dark:shadow-[0_16px_40px_-20px_rgba(0,0,0,0.45)] ${
              liveSettled && i === 0 ? "ring-2 ring-[var(--derby-gold)]/40" : ""
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="flex shrink-0 flex-col items-center gap-1">
                <RankBadge index={i} settled={liveSettled} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="text-2xl leading-none" aria-hidden>
                      {r.emoji}
                    </span>
                    <h2 className="truncate font-serif text-lg font-semibold text-[var(--foreground)]">{r.name}</h2>
                  </div>
                  {liveSettled && (
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="font-mono text-sm font-semibold text-[var(--derby-gold)]">
                        {r.score}/3{r.score === 3 ? " 🎯" : ""}
                      </span>
                      <ScoreDots score={r.score} />
                    </div>
                  )}
                </div>
                <div className="mt-4 space-y-2">
                  <PickLane place={1} label="1st pick" name={r.h1} post={r.post1} />
                  <PickLane place={2} label="2nd pick" name={r.h2} post={r.post2} />
                  <PickLane place={3} label="3rd pick" name={r.h3} post={r.post3} />
                </div>
              </div>
            </div>
          </li>
        ))}
        {!rows.length && (
          <li className="list-none rounded-3xl border border-dashed border-[var(--foreground)]/20 bg-[var(--foreground)]/[0.02] px-6 py-12 text-center text-sm text-[var(--derby-muted)]">
            No picks yet.{" "}
            <Link href={`/g/${slug}/pick`} className="font-medium text-[var(--derby-gold)] underline-offset-2 hover:underline">
              Be the first
            </Link>
            .
          </li>
        )}
      </ul>
    </div>
  );
}
