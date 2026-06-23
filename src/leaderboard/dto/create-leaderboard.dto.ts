export class CreateLeaderboardDto {
  name: string;
  category: string;
  period: string; // e.g., daily, weekly, all-time
  visibility?: 'public' | 'friends' | 'private';
  allowedUserIds?: number[];
} 