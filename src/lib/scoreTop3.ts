/** How many of the three ordered picks match the actual top 3 (position for position). */
export function top3ExactScore(
  pickFirst: string,
  pickSecond: string,
  pickThird: string,
  positions: string[],
): number {
  const a = positions[0];
  const b = positions[1];
  const c = positions[2];
  let s = 0;
  if (a && pickFirst === a) s += 1;
  if (b && pickSecond === b) s += 1;
  if (c && pickThird === c) s += 1;
  return s;
}
