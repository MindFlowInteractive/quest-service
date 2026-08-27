/**
 * Compute player level and progression from accumulated experience. (#414)
 */
const BASE_XP_PER_LEVEL = 100;
const XP_GROWTH_FACTOR = 1.15;

export function xpRequiredForLevel(level: number): number {
  return Math.round(BASE_XP_PER_LEVEL * Math.pow(XP_GROWTH_FACTOR, level - 1));
}

export function computeLevelFromXp(totalXp: number): { level: number; xpIntoLevel: number; xpToNextLevel: number } {
  let level = 1;
  let remainingXp = totalXp;

  for (;;) {
    const requiredForNext = xpRequiredForLevel(level);
    if (remainingXp < requiredForNext) {
      return { level, xpIntoLevel: remainingXp, xpToNextLevel: requiredForNext - remainingXp };
    }
    remainingXp -= requiredForNext;
    level += 1;
  }
}

export function isMilestoneLevel(level: number): boolean {
  return level % 10 === 0;
}
