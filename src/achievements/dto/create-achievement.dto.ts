export class CreateAchievementDto {
  name: string;
  description?: string;
  type: string; // e.g., 'leaderboard', 'milestone', etc.
  criteria?: any; // e.g., { leaderboardId: 1, rank: 1 }
}
