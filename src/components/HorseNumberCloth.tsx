/**
 * Post / program number — saddle-cloth style for leaderboards, results, etc.
 */
export function HorseNumberCloth({
  n,
  emphasis,
  variant = "default",
  className = "",
}: {
  n: number;
  emphasis: "gold" | "muted";
  variant?: "default" | "onDark";
  className?: string;
}) {
  const isGold = emphasis === "gold";
  const onDark = variant === "onDark";

  const goldCls = onDark
    ? "border-[var(--derby-gold)] bg-[var(--derby-gold)]/20 text-[var(--derby-gold)] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
    : "border-[var(--derby-gold)] bg-[var(--derby-gold)]/15 text-[var(--derby-gold)] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]";

  const mutedCls = onDark
    ? "border-[var(--derby-cream)]/35 bg-white/10 text-[var(--derby-cream)]"
    : "border-[var(--foreground)]/25 bg-[var(--foreground)]/8 text-[var(--foreground)]";

  return (
    <span
      className={`flex min-h-9 min-w-9 shrink-0 items-center justify-center rounded-lg border-2 px-1.5 font-mono text-base font-bold tabular-nums leading-none sm:min-h-10 sm:min-w-10 sm:text-lg ${className} ${
        isGold ? goldCls : mutedCls
      }`}
      aria-label={`Horse number ${n}`}
    >
      {n}
    </span>
  );
}
