export type PuzzleType = 'multiple-choice' | 'fill-blank' | 'drag-drop' | 'code' | 'visual' | 'logic-grid';

export interface HintContext {
  puzzleType: PuzzleType;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  puzzleState?: any;
  playerState?: { skillLevel?: number; mistakes?: number; timeElapsed?: number };
}

export interface GeneratedHint {
  order: number;
  type: 'general' | 'contextual' | 'strategic' | 'specific' | 'tutorial';
  content: string;
}

export function generateAlgorithmicHints(ctx: HintContext): GeneratedHint[] {
  const { puzzleType, difficulty, puzzleState, playerState } = ctx;
  const progress = puzzleState?.progress ?? 0;
  const errors = puzzleState?.errors ?? [];

  const generic: GeneratedHint = {
    order: 1,
    type: 'general',
    content: baseGuidance(puzzleType, difficulty),
  };

  const contextual: GeneratedHint = {
    order: 2,
    type: 'contextual',
    content: contextualGuidance(puzzleType, progress, errors),
  };

  const strategic: GeneratedHint = {
    order: 3,
    type: 'strategic',
    content: strategicGuidance(puzzleType, difficulty),
  };

  const specific: GeneratedHint = {
    order: 4,
    type: 'specific',
    content: specificNudge(puzzleType, puzzleState),
  };

  // Avoid spoilers: ensure specific hint nudges a direction without giving answers
  specific.content = maskPotentialSpoilers(specific.content);

  return [generic, contextual, strategic, specific];
}

function baseGuidance(type: PuzzleType, difficulty: HintContext['difficulty']): string {
  switch (type) {
    case 'multiple-choice':
      return 'Eliminate clearly wrong options first to narrow your choices.';
    case 'fill-blank':
      return 'Break the problem into smaller parts and verify each piece.';
    case 'drag-drop':
      return 'Group related items before placing them to see patterns.';
    case 'code':
      return 'Recreate the failing case in a minimal example and test iteratively.';
    case 'visual':
      return 'Scan for symmetry and repeated shapes; start from the edges.';
    case 'logic-grid':
      return 'Use process of elimination and mark contradictions immediately.';
  }
}

function contextualGuidance(type: PuzzleType, progress: number, errors: string[]): string {
  if (progress < 0.33) {
    return 'Focus on the initial constraints before exploring alternatives.';
  }
  if (errors?.length) {
    return `Review recent steps; watch out for: ${errors.slice(0, 2).join(', ')}.`;
  }
  return 'You are on track—double-check the last step for consistency.';
}

function strategicGuidance(type: PuzzleType, difficulty: HintContext['difficulty']): string {
  if (difficulty === 'hard' || difficulty === 'expert') {
    return 'Consider tackling sub-problems first and merging insights later.';
  }
  return 'Try a simpler path first; verify assumptions before proceeding.';
}

function specificNudge(type: PuzzleType, puzzleState: any): string {
  switch (type) {
    case 'multiple-choice':
      return 'Re-check the option contradicting the main clue from earlier.';
    case 'logic-grid':
      return 'Look at the intersection of the two most constrained categories.';
    case 'code':
      return 'Inspect boundary conditions around the input size and null handling.';
    default:
      return 'Revisit the step where your approach first diverged.';
  }
}

function maskPotentialSpoilers(text: string): string {
  // Ensure we nudge, not reveal; redact any digits or explicit option labels
  return text.replace(/[A-Z]\)/g, 'option').replace(/\b\d+\b/g, 'n');
}


