export const ACHIEVEMENTS = [
  {
    code: 'PUZZLE_10',
    title: 'Puzzle Novice',
    description: 'Completed 10 puzzles',
    condition: (progress) => progress.puzzlesCompleted >= 10,
  },
  {
    code: 'PUZZLE_50',
    title: 'Puzzle Warrior',
    description: 'Completed 50 puzzles',
    condition: (progress) => progress.puzzlesCompleted >= 50,
  },
  {
    code: 'STREAK_5',
    title: 'Streak Beginner',
    description: '5-day puzzle streak',
    condition: (progress) => progress.streakDays >= 5,
  },
];
