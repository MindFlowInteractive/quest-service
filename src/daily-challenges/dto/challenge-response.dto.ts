import { Expose, Transform } from 'class-transformer';

export class PuzzleResponseDto {
  @Expose()
  id: string;

  @Expose()
  title: string;

  @Expose()
  description: string;

  @Expose()
  difficulty: string;

  @Expose()
  difficultyRating: number;

  @Expose()
  basePoints: number;

  @Expose()
  timeLimit: number;

  @Expose()
  maxHints: number;
}

export class DailyChallengeResponseDto {
  @Expose()
  id: string;

  @Expose()
  challengeDate: Date;

  @Expose()
  puzzle: PuzzleResponseDto;

  @Expose()
  baseRewardPoints: number;

  @Expose()
  bonusXP: number;

  @Expose()
  completionCount: number;

  @Expose()
  @Transform(({ obj }) => !!obj.completions?.length)
  userCompleted?: boolean;
}

export class WeeklyChallengeResponseDto {
  @Expose()
  id: string;

  @Expose()
  weekStart: Date;

  @Expose()
  puzzles: PuzzleResponseDto[];

  @Expose()
  bonusXP: number;

  @Expose()
  completionCount: number;

  @Expose()
  userProgress?: {
    completedPuzzleIds: string[];
    allPuzzlesCompleted: boolean;
    bonusXPAwarded: number;
  };
}

export class ChallengeCompletionResponseDto {
  @Expose()
  success: boolean;

  @Expose()
  currentStreak: number;

  @Expose()
  bonusPointsAwarded: number;

  @Expose()
  bonusXPAwarded: number;

  @Expose()
  totalPointsEarned: number;

  @Expose()
  totalXPEarned: number;

  @Expose()
  firstAchievementUnlocked?: string;
}

export class ChallengeHistoryItemDto {
  @Expose()
  id: string;

  @Expose()
  dailyChallenge?: {
    id: string;
    challengeDate: Date;
    puzzle: PuzzleResponseDto;
  };

  @Expose()
  score: number;

  @Expose()
  timeSpent: number;

  @Expose()
  streakBonusAwarded: number;

  @Expose()
  bonusXPAwarded: number;

  @Expose()
  completedAt: Date;
}
