import RecommendationService from './recommendation.service';

describe('RecommendationService', () => {
  let svc: RecommendationService;

  beforeEach(() => {
    svc = new RecommendationService();
    // add some puzzles
    svc.addPuzzle({ id: 'p1', tags: { math: 1, logic: 0.8 }, difficulty: 0.3 });
    svc.addPuzzle({ id: 'p2', tags: { math: 1 }, difficulty: 0.5 });
    svc.addPuzzle({ id: 'p3', tags: { words: 1 }, difficulty: 0.2 });
    svc.addPuzzle({ id: 'p4', tags: { logic: 1 }, difficulty: 0.6 });
    svc.addPuzzle({ id: 'p5', tags: { spatial: 1 }, difficulty: 0.4 });

    // seed popularity
    svc.recordInteraction('seed', 'p1', 'click');
    svc.recordInteraction('seed', 'p2', 'click');
    svc.recordInteraction('seed', 'p2', 'click');
  });

  test('cold start returns popular-like results', () => {
    const recs = svc.getRecommendations('new_user_1', 3);
    expect(recs.length).toBeGreaterThan(0);
    // should include popular items p2 or p1
    const ids = recs.map((r) => r.puzzleId);
    expect(ids).toContain('p2');
  });

  test('personalized recommendations differ after interactions', () => {
    // user interacts with word puzzles
    svc.recordInteraction('u1', 'p3', 'click');
    svc.recordInteraction('u1', 'p3', 'complete');
    svc.recordInteraction('u1', 'p5', 'view');

    const recs = svc.getRecommendations('u1', 5);
    // expect that p3 is not recommended, and similar tags (none) prioritized
    const ids = recs.map((r) => r.puzzleId);
    expect(ids.includes('p3')).toBe(false);
  });

  test('metrics track CTR and completion', () => {
    const uid = 'metricUser';
    const recs = svc.getRecommendations(uid, 2);
    // simulate clicks and completions
    for (const r of recs) {
      svc.recordClick(uid, r.puzzleId);
    }
    svc.recordCompletion(uid, recs[0].puzzleId);
    const metrics = svc.getMetrics();
    // variant is deterministic; ensure structure exists
    const variant = require('./abtest').assignVariant(uid);
    expect(metrics[variant]).toBeDefined();
    const entry = metrics[variant][recs[0].puzzleId];
    expect(entry.clicks).toBeGreaterThanOrEqual(1);
    expect(entry.completes).toBeGreaterThanOrEqual(1);
  });
});
