export class Player {
  id: string;
  elo: number;
  preferences: {
    difficulty?: string;
    type?: string;
  };
  joinedAt: number;
}
