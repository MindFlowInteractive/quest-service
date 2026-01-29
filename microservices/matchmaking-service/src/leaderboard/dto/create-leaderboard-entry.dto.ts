export class CreateLeaderboardEntryDto {
  leaderboardId: number;
  userId: number;
  score: number;
  timeTaken?: number;
  efficiency?: number;
} 