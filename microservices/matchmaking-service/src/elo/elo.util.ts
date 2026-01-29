export function isEloCompatible(
  eloA: number,
  eloB: number,
  maxDifference: number,
): boolean {
  return Math.abs(eloA - eloB) <= maxDifference;
}
