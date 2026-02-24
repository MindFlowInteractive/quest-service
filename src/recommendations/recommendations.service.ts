import { Injectable } from '@nestjs/common';

type Puzzle = {
  id: string;
  tags: string[];
  difficulty: number; // 1..10
  popularity?: number; // computed
};

type PlayerProfile = {
  id: string;
  skillLevel: number; // 1..10
  preferences: string[]; // tags
  completed: Map<string, number>; // puzzleId -> completions
};

type InteractionEvent = {
  playerId: string;
  puzzleId: string;
  type: 'view' | 'click' | 'start' | 'complete';
  timestamp: number;
};

@Injectable()
export class RecommendationsService {
  // In-memory stores for prototype; swap with DB repositories later
  private puzzles = new Map<string, Puzzle>();
  private players = new Map<string, PlayerProfile>();
  private interactions: InteractionEvent[] = [];

  // Simple metrics store
  private metrics = {
    impressions: new Map<string, number>(),
    clicks: new Map<string, number>(),
    completions: new Map<string, number>(),
  };

  // Register puzzle metadata into the recommender
  registerPuzzle(p: Puzzle) {
    this.puzzles.set(p.id, { ...p, popularity: p.popularity ?? 0 });
  }

  // Create or update a player profile
  upsertPlayer(profile: { id: string; skillLevel?: number; preferences?: string[] }) {
    const existing = this.players.get(profile.id);
    if (existing) {
      existing.skillLevel = profile.skillLevel ?? existing.skillLevel;
      existing.preferences = profile.preferences ?? existing.preferences;
      return existing;
    }
    const p: PlayerProfile = {
      id: profile.id,
      skillLevel: profile.skillLevel ?? 5,
      preferences: profile.preferences ?? [],
      completed: new Map<string, number>(),
    };
    this.players.set(profile.id, p);
    return p;
  }

  // Track player interactions
  trackEvent(e: InteractionEvent) {
    this.interactions.push(e);
    if (e.type === 'complete') {
      const player = this.players.get(e.playerId);
      if (player) {
        player.completed.set(e.puzzleId, (player.completed.get(e.puzzleId) ?? 0) + 1);
      }
      // update puzzle popularity
      const p = this.puzzles.get(e.puzzleId);
      if (p) p.popularity = (p.popularity ?? 0) + 1;
      // metrics
      this.metrics.completions.set(e.puzzleId, (this.metrics.completions.get(e.puzzleId) ?? 0) + 1);
    }
    if (e.type === 'click') {
      this.metrics.clicks.set(e.puzzleId, (this.metrics.clicks.get(e.puzzleId) ?? 0) + 1);
    }
    if (e.type === 'view') {
      this.metrics.impressions.set(e.puzzleId, (this.metrics.impressions.get(e.puzzleId) ?? 0) + 1);
    }
  }

  // Assign A/B variant deterministically
  assignVariant(playerId: string) {
    // simple hash mod 2: control/treatment
    let hash = 0;
    for (let i = 0; i < playerId.length; i++) hash = (hash * 31 + playerId.charCodeAt(i)) | 0;
    return Math.abs(hash) % 2 === 0 ? 'control' : 'treatment';
  }

  // Content similarity: tag overlap weighted by preferences
  private contentScore(player: PlayerProfile, puzzle: Puzzle) {
    if (!puzzle.tags || puzzle.tags.length === 0) return 0;
    const prefSet = new Set(player.preferences || []);
    let score = 0;
    for (const t of puzzle.tags) {
      if (prefSet.has(t)) score += 2; // preferred tags boosted
      else score += 1;
    }
    // penalize too-hard puzzles
    const diff = Math.abs(player.skillLevel - puzzle.difficulty);
    const difficultyPenalty = Math.max(0, 1 - diff / 10);
    return score * difficultyPenalty;
  }

  // Collaborative filtering (user-based): cosine similarity on completed puzzles
  private collaborativeScore(target: PlayerProfile, puzzle: Puzzle) {
    // build vector on completed puzzles for each other player who completed this puzzle
    let numerator = 0;
    let targetLen = 0;
    for (const [, cnt] of target.completed) targetLen += cnt * cnt;
    targetLen = Math.sqrt(targetLen) || 1;

    for (const [, other] of this.players) {
      if (other.id === target.id) continue;
      const otherCnt = other.completed.get(puzzle.id) ?? 0;
      if (otherCnt === 0) continue; // only consider players who completed the target puzzle
      // similarity between target and other
      let dot = 0;
      let otherLen = 0;
      for (const [pid, cnt] of target.completed) {
        dot += cnt * (other.completed.get(pid) ?? 0);
      }
      for (const [, cnt] of other.completed) otherLen += cnt * cnt;
      otherLen = Math.sqrt(otherLen) || 1;
      const sim = dot / (targetLen * otherLen);
      numerator += sim * otherCnt; // weight by other player's engagement on puzzle
    }
    return numerator;
  }

  // Generate recommendations for a user
  generateRecommendations(playerId: string, limit = 10) {
    const player = this.players.get(playerId);
    // Cold start: no profile -> return popular + matched to preferences if any
    if (!player) {
      // top popular puzzles
      const popular = Array.from(this.puzzles.values())
        .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))
        .slice(0, limit)
        .map((p) => ({ puzzle: p, score: p.popularity ?? 0, explanation: 'Popular puzzle' }));
      return { variant: this.assignVariant(playerId), results: popular };
    }

    const seen = new Set(Array.from(player.completed.keys()));
    const candidates = Array.from(this.puzzles.values()).filter((p) => !seen.has(p.id));

    const scored = candidates.map((p) => {
      const cscore = this.contentScore(player, p);
      const cf = this.collaborativeScore(player, p);
      // combine: give content a bit more weight for personalization
      const score = 0.6 * cscore + 0.4 * cf + (p.popularity ?? 0) * 0.01;
      const explanation = this.explainRecommendation(player, p, { cscore, cf });
      return { puzzle: p, score, explanation };
    });

    scored.sort((a, b) => b.score - a.score);
    const variant = this.assignVariant(playerId);
    // A/B treatment example: slightly shuffle or boost novelty for treatment
    const results = scored.slice(0, limit).map((r, idx) => {
      let finalScore = r.score;
      if (variant === 'treatment') {
        // boost less-popular puzzles slightly to improve exploration
        finalScore += (1 / (1 + (r.puzzle.popularity ?? 0))) * 0.1;
      }
      // record impression metric
      this.metrics.impressions.set(r.puzzle.id, (this.metrics.impressions.get(r.puzzle.id) ?? 0) + 1);
      return { puzzle: r.puzzle, score: finalScore, explanation: r.explanation };
    });

    return { variant, results };
  }

  // Return a short explanation for why a puzzle was recommended
  explainRecommendation(player: PlayerProfile, puzzle: Puzzle, details?: { cscore?: number; cf?: number }) {
    const reasons: string[] = [];
    if (details?.cscore && details.cscore > 0) reasons.push('Matches your interests');
    if (details?.cf && details.cf > 0) reasons.push('Played by similar players');
    if ((puzzle.popularity ?? 0) > 10) reasons.push('Popular');
    const diff = Math.abs(player.skillLevel - puzzle.difficulty);
    if (diff <= 2) reasons.push('Skill-appropriate');
    return reasons.length > 0 ? reasons.join('; ') : 'Recommended for you';
  }

  // Expose metrics for dashboarding
  getMetrics() {
    const toObj = (m: Map<string, number>) => Object.fromEntries(m.entries());
    return { impressions: toObj(this.metrics.impressions), clicks: toObj(this.metrics.clicks), completions: toObj(this.metrics.completions) };
  }
}
