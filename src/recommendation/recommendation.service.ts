import { PuzzleMeta, Recommendation, InteractionAction } from './types';
import { assignVariant, Variant } from './abtest';

function dot(a: number[], b: number[]) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

function magnitude(a: number[]) {
  return Math.sqrt(a.reduce((s, v) => s + v * v, 0));
}

export class RecommendationService {
  private userInteractions = new Map<string, Map<string, number>>();
  private puzzleMeta = new Map<string, PuzzleMeta>();
  private puzzlePopularity = new Map<string, number>();

  // metrics: variant -> puzzleId -> {impr, clicks, completes}
  private metrics = new Map<string, Map<string, { impr: number; clicks: number; completes: number }>>();

  addPuzzle(meta: PuzzleMeta) {
    this.puzzleMeta.set(meta.id, meta);
    if (!this.puzzlePopularity.has(meta.id)) this.puzzlePopularity.set(meta.id, 0);
  }

  recordInteraction(userId: string, puzzleId: string, action: InteractionAction) {
    if (!this.userInteractions.has(userId)) this.userInteractions.set(userId, new Map());
    const u = this.userInteractions.get(userId)!;
    const weight = action === 'view' ? 1 : action === 'click' ? 3 : 5;
    u.set(puzzleId, (u.get(puzzleId) || 0) + weight);
    if (action === 'click' || action === 'complete') {
      this.puzzlePopularity.set(puzzleId, (this.puzzlePopularity.get(puzzleId) || 0) + 1);
    }
  }

  recordImpression(userId: string, puzzleId: string) {
    const variant = assignVariant(userId);
    this.bumpMetric(variant, puzzleId, 'impr');
  }

  recordClick(userId: string, puzzleId: string) {
    const variant = assignVariant(userId);
    this.bumpMetric(variant, puzzleId, 'clicks');
  }

  recordCompletion(userId: string, puzzleId: string) {
    const variant = assignVariant(userId);
    this.bumpMetric(variant, puzzleId, 'completes');
  }

  private bumpMetric(variant: Variant, puzzleId: string, key: 'impr' | 'clicks' | 'completes') {
    if (!this.metrics.has(variant)) this.metrics.set(variant, new Map());
    const m = this.metrics.get(variant)!;
    if (!m.has(puzzleId)) m.set(puzzleId, { impr: 0, clicks: 0, completes: 0 });
    const entry = m.get(puzzleId)!;
    entry[key]++;
  }

  getMetrics() {
    const out: Record<string, any> = {};
    for (const [variant, map] of this.metrics) {
      out[variant] = {};
      for (const [pid, d] of map) {
        out[variant][pid] = {
          impressions: d.impr,
          clicks: d.clicks,
          completes: d.completes,
          ctr: d.impr ? d.clicks / d.impr : 0,
          completionRate: d.impr ? d.completes / d.impr : 0,
        };
      }
    }
    return out;
  }

  // Main recommendation entrypoint
  getRecommendations(userId: string, limit = 10): Recommendation[] {
    const variant = assignVariant(userId);
    // Baseline A: popularity
    if (variant === 'A') {
      return this.topPopular(limit).map((pid) => ({ puzzleId: pid, score: this.puzzlePopularity.get(pid) || 0, reason: 'Popular puzzle (A)' }));
    }

    // Variant B: personalized mix
    const userVec = this.userInteractions.get(userId) || new Map();
    if (userVec.size < 3) {
      // cold start: return popular + content-similar if any
      return this.coldStartRecommendations(userId, limit);
    }

    const scores = new Map<string, number>();

    // content-based: build user tag profile
    const userTags = this.buildUserTagProfile(userVec);

    for (const [pid, meta] of this.puzzleMeta) {
      // skip already strongly completed puzzles
      const base = this.contentScore(userTags, meta);
      scores.set(pid, (scores.get(pid) || 0) + base * 2);
    }

    // collaborative: simple user-neighbor scoring via interaction overlap
    const collScores = this.collaborativeScores(userId);
    for (const [pid, s] of collScores) scores.set(pid, (scores.get(pid) || 0) + s);

    // blend with popularity
    for (const [pid, pop] of this.puzzlePopularity) scores.set(pid, (scores.get(pid) || 0) + pop * 0.1);

    const recs = Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([puzzleId, score]) => ({ puzzleId, score, reason: 'Personalized mix (B)' }));

    // record impressions
    recs.forEach((r) => this.recordImpression(userId, r.puzzleId));
    return recs;
  }

  private topPopular(limit: number) {
    return Array.from(this.puzzlePopularity.entries()).sort((a, b) => b[1] - a[1]).slice(0, limit).map((e) => e[0]);
  }

  private coldStartRecommendations(userId: string, limit: number) {
    // prefer popular but also score by tag similarity to user if user has any minimal interactions
    const u = this.userInteractions.get(userId) || new Map();
    const userTags = this.buildUserTagProfile(u);
    const scores = new Map<string, number>();
    for (const [pid, meta] of this.puzzleMeta) {
      const content = this.contentScore(userTags, meta);
      const pop = this.puzzlePopularity.get(pid) || 0;
      scores.set(pid, pop * 0.7 + content * 0.3);
    }
    return Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([puzzleId, score]) => ({ puzzleId, score, reason: 'Cold-start (popularity + content)' }));
  }

  private buildUserTagProfile(userVec: Map<string, number>) {
    const tags: Record<string, number> = {};
    for (const [pid, w] of userVec) {
      const meta = this.puzzleMeta.get(pid);
      if (!meta) continue;
      for (const [t, tv] of Object.entries(meta.tags)) tags[t] = (tags[t] || 0) + tv * w;
    }
    return tags;
  }

  private contentScore(userTags: Record<string, number>, meta: PuzzleMeta) {
    const allKeys = Array.from(new Set([...Object.keys(userTags), ...Object.keys(meta.tags)]));
    if (allKeys.length === 0) return 0;
    const a = allKeys.map((k) => userTags[k] || 0);
    const b = allKeys.map((k) => meta.tags[k] || 0);
    const denom = magnitude(a) * magnitude(b);
    return denom ? dot(a, b) / denom : 0;
  }

  private collaborativeScores(userId: string) {
    // find nearest users by cosine similarity over interaction vectors
    const target = this.userInteractions.get(userId) || new Map();
    const scores = new Map<string, number>();
    for (const [otherId, vec] of this.userInteractions) {
      if (otherId === userId) continue;
      const sim = this.interactionCosine(target, vec);
      if (sim <= 0) continue;
      for (const [pid, w] of vec) {
        if (target.has(pid)) continue; // don't recommend already interacted
        scores.set(pid, (scores.get(pid) || 0) + sim * w);
      }
    }
    return scores;
  }

  private interactionCosine(a: Map<string, number>, b: Map<string, number>) {
    const keys = Array.from(new Set([...a.keys(), ...b.keys()]));
    const va = keys.map((k) => a.get(k) || 0);
    const vb = keys.map((k) => b.get(k) || 0);
    const denom = magnitude(va) * magnitude(vb);
    return denom ? dot(va, vb) / denom : 0;
  }
}

export default RecommendationService;
