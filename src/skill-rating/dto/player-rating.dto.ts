export class PlayerRatingDto {
  id: string;
  userId: string;
  rating: number;
  ratingDeviation: number;
  tier: string;
  seasonId: string;
  seasonStatus: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  streak: number;
  bestStreak: number;
  lastPlayedAt: Date;
  lastRatingUpdate: Date;
  winRate: number;
  statistics: {
    puzzlesSolved?: number;
    averageCompletionTime?: number;
    accuracyRate?: number;
    highestRating?: number;
    lowestRating?: number;
    ratingHistory?: Array<{
      date: Date;
      rating: number;
      change: number;
      puzzleId?: string;
      difficulty?: string;
    }>;
  };
  createdAt: Date;
  updatedAt: Date;
}
