import { generateAlgorithmicHints } from './engine';

describe('generateAlgorithmicHints', () => {
  it('returns four progressively deeper hints', () => {
    const hints = generateAlgorithmicHints({
      puzzleType: 'logic-grid',
      difficulty: 'medium',
      puzzleState: { progress: 0 },
    });

    expect(hints.map((hint) => hint.order)).toEqual([1, 2, 3, 4]);
    expect(hints.map((hint) => hint.type)).toEqual([
      'general',
      'contextual',
      'strategic',
      'specific',
    ]);
    hints.forEach((hint) => expect(hint.content.length).toBeGreaterThan(0));
  });

  it('adapts the contextual hint to puzzle progress', () => {
    const early = generateAlgorithmicHints({
      puzzleType: 'visual',
      difficulty: 'easy',
      puzzleState: { progress: 0 },
    }).find((hint) => hint.type === 'contextual');

    const late = generateAlgorithmicHints({
      puzzleType: 'visual',
      difficulty: 'easy',
      puzzleState: { progress: 0.6 },
    }).find((hint) => hint.type === 'contextual');

    expect(early.content).not.toBe(late.content);
    expect(early.content).toMatch(/initial constraints/);
  });

  it('mentions recent errors when they are present', () => {
    const contextual = generateAlgorithmicHints({
      puzzleType: 'code',
      difficulty: 'hard',
      puzzleState: { progress: 0.5, errors: ['off-by-one', 'null deref'] },
    }).find((hint) => hint.type === 'contextual');

    expect(contextual.content).toContain('off-by-one');
  });

  it('masks digits and option labels in the specific hint', () => {
    const hints = generateAlgorithmicHints({
      puzzleType: 'multiple-choice',
      difficulty: 'hard',
      puzzleState: { progress: 0.5, errors: ['A) wrong', '42'] },
    });

    const specific = hints.find((hint) => hint.type === 'specific');
    expect(specific.content).not.toMatch(/\b\d+\b/);
    expect(specific.content).not.toMatch(/[A-Z]\)/);
  });

  it('never reveals the solution text', () => {
    const hints = generateAlgorithmicHints({
      puzzleType: 'fill-blank',
      difficulty: 'expert',
      puzzleState: { progress: 0.9, solution: 'SECRET_ANSWER', errors: [] },
    });

    hints.forEach((hint) => {
      expect(hint.content).not.toContain('SECRET_ANSWER');
    });
  });
});
