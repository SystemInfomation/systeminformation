"use client";

import type { LeaderboardRow } from "@/lib/leaderboardRows";
import Link from "next/link";
import { useEffect, useState } from "react";

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
    <div className="space-y-3">
      <p className="text-xs text-[var(--derby-muted)]" aria-live="polite">
        Live board · refreshes every 5 seconds
      </p>
      <div className="overflow-x-auto rounded-3xl border border-white/10">
        <table className="w-full text-left text-sm text-[var(--foreground)]">
          <thead className="bg-white/5 text-xs uppercase text-[var(--derby-muted)]">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">1st pick</th>
              <th className="px-4 py-3">2nd pick</th>
              <th className="px-4 py-3">3rd pick</th>
              {liveSettled && <th className="px-4 py-3">Score</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-white/10">
                <td className="px-4 py-3 font-medium">
                  <span className="mr-1">{r.emoji}</span>
                  {r.name}
                </td>
                <td className="px-4 py-3">{r.h1}</td>
                <td className="px-4 py-3">{r.h2}</td>
                <td className="px-4 py-3">{r.h3}</td>
                {liveSettled && (
                  <td className="px-4 py-3 font-mono text-[var(--derby-gold)]">
                    {r.score}/3 {r.score === 3 ? "🎯" : ""}
                  </td>
                )}
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={liveSettled ? 5 : 4} className="px-4 py-8 text-center text-[var(--derby-muted)]">
                  No picks yet.{" "}
                  <Link href={`/g/${slug}/pick`} className="text-[var(--derby-gold)]">
                    Be the first
                  </Link>
                  .
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
