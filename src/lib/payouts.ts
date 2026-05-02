/**
 * Fixed-odds style payouts for fake-money settlement.
 * Win: return stake * (1 + num/den)
 * Place: return stake * (1 + (num/den) * placeRatio) when horse finishes 1st or 2nd
 * Show: return stake * (1 + (num/den) * showRatio) when horse finishes 1st–3rd
 */

export function winReturn(stake: number, oddsNum: number, oddsDen: number): number {
  if (oddsDen <= 0) return stake;
  const dec = oddsNum / oddsDen;
  return stake * (1 + dec);
}

export function placeReturn(
  stake: number,
  oddsNum: number,
  oddsDen: number,
  placeRatio: number,
): number {
  if (oddsDen <= 0) return stake;
  const dec = (oddsNum / oddsDen) * placeRatio;
  return stake * (1 + dec);
}

export function showReturn(
  stake: number,
  oddsNum: number,
  oddsDen: number,
  showRatio: number,
): number {
  if (oddsDen <= 0) return stake;
  const dec = (oddsNum / oddsDen) * showRatio;
  return stake * (1 + dec);
}

export function exactaReturn(stake: number, multiplier: number): number {
  return stake * multiplier;
}

export function trifectaReturn(stake: number, multiplier: number): number {
  return stake * multiplier;
}

/** Implied win probability from fractional odds (no vig). */
export function impliedWinProb(oddsNum: number, oddsDen: number): number {
  if (oddsNum + oddsDen <= 0) return 0;
  return oddsDen / (oddsNum + oddsDen);
}
