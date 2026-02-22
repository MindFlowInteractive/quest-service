export class UpdateRatingDto {
  userId: string;
  puzzleId: string;
  puzzleDifficulty: string;
  difficultyRating: number;
  wasCompleted: boolean;
  timeTaken: number;
  hintsUsed: number;
  attempts: number;
  basePoints: number;
}
