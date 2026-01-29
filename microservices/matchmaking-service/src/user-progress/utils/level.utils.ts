export function calculateLevel(xp: number) {
  const baseXP = 100; 
  const growthFactor = 1.2; 

  let level = 1;
  let xpForNextLevel = baseXP;

  while (xp >= xpForNextLevel) {
    xp -= xpForNextLevel;
    level++;
    xpForNextLevel = Math.floor(baseXP * Math.pow(growthFactor, level - 1));
  }

  const progressToNextLevel = (xp / xpForNextLevel) * 100;

  return {
    level,
    xpToNextLevel: xpForNextLevel - xp,
    progressPercent: Math.floor(progressToNextLevel),
  };
}
