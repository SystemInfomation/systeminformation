"use client";

import Link from "next/link";
import { useTheme } from "next-themes";

const SLUG = "derby-2026";

export function SiteHeader() {
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--derby-gold)]/25 bg-[var(--derby-forest)]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="font-serif text-lg font-semibold tracking-tight text-[var(--derby-cream)]">
          <span className="text-[var(--derby-gold)]">Derby</span> Family
        </Link>
        <nav className="flex flex-wrap items-center gap-2 text-sm">
          <Link
            href={`/g/${SLUG}/pick`}
            className="rounded-full border border-[var(--derby-gold)]/40 px-3 py-1 text-[var(--derby-cream)] hover:bg-[var(--derby-gold)]/10"
          >
            Picks
          </Link>
          <Link
            href={`/g/${SLUG}/leaderboard`}
            className="rounded-full border border-transparent px-3 py-1 text-[var(--derby-cream)] hover:bg-white/5"
          >
            Everyone
          </Link>
          <Link
            href={`/g/${SLUG}/results`}
            className="rounded-full border border-transparent px-3 py-1 text-[var(--derby-cream)] hover:bg-white/5"
          >
            Results
          </Link>
          <Link
            href={`/admin/${SLUG}`}
            className="rounded-full border border-transparent px-3 py-1 text-[var(--derby-muted)] hover:text-[var(--derby-cream)]"
          >
            Office
          </Link>
          <button
            type="button"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-full border border-white/15 px-2 py-1 text-xs text-[var(--derby-cream)]"
          >
            {theme === "dark" ? "Light" : "Dark"}
          </button>
        </nav>
      </div>
    </header>
  );
}
