export type InteractionAction = 'view' | 'click' | 'complete';

export interface PuzzleMeta {
  id: string;
  tags: Record<string, number>; // tag -> weight
  difficulty?: number; // 0-1
}

export interface Recommendation {
  puzzleId: string;
  score: number;
  reason: string;
}
