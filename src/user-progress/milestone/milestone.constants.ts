export const MILESTONE_TYPES = {
  XP: 'XP',
  PUZZLE: 'PUZZLE',
  STREAK: 'STREAK',
  ACHIEVEMENT: 'ACHIEVEMENT',
};

export const MILESTONES = [
  {
    type: MILESTONE_TYPES.XP,
    threshold: 1000,
    message: '🎉 Reached 1,000 XP!',
  },
  {
    type: MILESTONE_TYPES.XP,
    threshold: 5000,
    message: '🔥 5,000 XP milestone unlocked!',
  },
  {
    type: MILESTONE_TYPES.PUZZLE,
    threshold: 10,
    message: '🧠 Solved 10 puzzles!',
  },
  {
    type: MILESTONE_TYPES.STREAK,
    threshold: 7,
    message: '📆 7-day streak maintained!',
  },
  {
    type: MILESTONE_TYPES.ACHIEVEMENT,
    threshold: 5,
    message: '🏅 Unlocked 5 achievements!',
  },
];
