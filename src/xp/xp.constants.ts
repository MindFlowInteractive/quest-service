export const PLAYER_LEVEL_UP_EVENT = 'player.level_up';

export enum XpAwardReason {
  PUZZLE_SOLVED = 'puzzle_solved',
  NO_HINTS_USED = 'no_hints_used',
  FIRST_DAILY_SOLVE = 'first_daily_solve',
  STREAK_MILESTONE = 'streak_milestone',
  CHALLENGE_BONUS = 'challenge_bonus',
}
