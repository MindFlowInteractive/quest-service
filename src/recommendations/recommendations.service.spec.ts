import { RecommendationsService } from './recommendations.service';

describe('RecommendationsService', () => {
  let svc: RecommendationsService;

  beforeEach(() => {
    svc = new RecommendationsService();
    // seed puzzles
    svc.registerPuzzle({ id: 'p1', tags: ['logic', 'math'], difficulty: 5 });
    svc.registerPuzzle({ id: 'p2', tags: ['pattern', 'visual'], difficulty: 4 });
    svc.registerPuzzle({ id: 'p3', tags: ['logic', 'strategy'], difficulty: 7 });
    svc.registerPuzzle({ id: 'popular', tags: ['casual'], difficulty: 3, popularity: 50 });
  });

  it('creates and upserts player profile', () => {
    const p = svc.upsertPlayer({ id: 'u1', skillLevel: 5, preferences: ['logic'] });
    expect(p.id).toBe('u1');
    expect(p.skillLevel).toBe(5);
    expect(p.preferences).toContain('logic');
  });

  it('recommends personalized puzzles and includes explanation', () => {
    svc.upsertPlayer({ id: 'u2', skillLevel: 5, preferences: ['logic'] });
    // user completed p2 previously
    svc.trackEvent({ playerId: 'u2', puzzleId: 'p2', type: 'complete', timestamp: Date.now() });
    const res = svc.generateRecommendations('u2', 5);
    expect(res.results.length).toBeGreaterThan(0);
    // recommended items should include explanation strings
    expect(res.results[0].explanation).toBeDefined();
  });

  it('handles cold start for unknown user by returning popular puzzles', () => {
    const res = svc.generateRecommendations('new-user', 3);
    expect(res.results.some((r) => r.puzzle.id === 'popular')).toBeTruthy();
  });
});
