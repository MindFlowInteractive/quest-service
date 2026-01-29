export interface Player {
  id: string;
  elo: number;
  preferences: {
    difficulty?: 'easy' | 'medium' | 'hard';
    type?: string;
  };
  joinedAt: number;
}
