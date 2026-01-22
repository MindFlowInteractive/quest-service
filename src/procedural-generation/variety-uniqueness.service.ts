/**
 * Variety and Uniqueness Ensuring System
 * Maintains puzzle diversity and freshness
 */

import { Injectable, Logger } from '@nestjs/common';
import { GeneratedPuzzle, VarietyTracker, PuzzleType, DifficultyLevel } from './types';
import * as crypto from 'crypto';

interface DiversityMetrics {
  uniquenessToBucket: number; // 0-1
  diversityScore: number; // 0-1
  varietyScore: number; // 0-1
  freshness: number; // 0-1
}

@Injectable()
export class VarietyAndUniquenessService {
  private readonly logger = new Logger(VarietyAndUniquenessService.name);

  private readonly varietyTrackers: Map<string, VarietyTracker> = new Map();
  private readonly puzzleHashes: Set<string> = new Set();
  private readonly generationHistory: GeneratedPuzzle[] = [];
  private readonly maxHistorySize = 1000;
  private readonly uniquenessWindow = 24 * 60 * 60 * 1000; // 24 hours in ms

  /**
   * Ensures generated puzzle is unique
   */
  ensureUniqueness(
    puzzle: GeneratedPuzzle,
  ): {
    isUnique: boolean;
    similarPuzzles: GeneratedPuzzle[];
    uniquenessScore: number;
    suggestions: string[];
  } {
    const puzzleHash = this.generatePuzzleHash(puzzle);
    const similarPuzzles = this.findSimilarPuzzles(puzzle);
    const uniquenessScore = 1 - (similarPuzzles.length / Math.max(1, this.generationHistory.length));

    const isUnique = similarPuzzles.length === 0 && uniquenessScore >= 0.8;

    const suggestions: string[] = [];
    if (!isUnique) {
      if (similarPuzzles.length > 0) {
        suggestions.push(`Found ${similarPuzzles.length} similar puzzles - consider regenerating`);
      }
      if (uniquenessScore < 0.8) {
        suggestions.push('Uniqueness score below threshold - try different parameters');
      }
    }

    if (isUnique) {
      this.puzzleHashes.add(puzzleHash);
      this.generationHistory.push(puzzle);
      this.trimHistory();
    }

    return {
      isUnique,
      similarPuzzles,
      uniquenessScore,
      suggestions,
    };
  }

  /**
   * Calculates puzzle hash for duplicate detection
   */
  private generatePuzzleHash(puzzle: GeneratedPuzzle): string {
    const content = JSON.stringify({
      type: puzzle.type,
      difficulty: puzzle.difficulty,
      contentSummary: this.summarizeContent(puzzle.content),
      solutionHash: this.hashString(JSON.stringify(puzzle.solution)),
    });

    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Summarizes puzzle content for hashing
   */
  private summarizeContent(content: any): string {
    const contentStr = JSON.stringify(content);
    return contentStr.substring(0, 100); // Use first 100 chars as summary
  }

  /**
   * Helper function to hash strings
   */
  private hashString(str: string): string {
    return crypto.createHash('sha256').update(str).digest('hex').substring(0, 16);
  }

  /**
   * Finds similar puzzles in history
   */
  private findSimilarPuzzles(puzzle: GeneratedPuzzle): GeneratedPuzzle[] {
    const similarityThreshold = 0.75;
    const similar: GeneratedPuzzle[] = [];

    // Check recent puzzles within uniqueness window
    const cutoffTime = Date.now() - this.uniquenessWindow;

    for (const historical of this.generationHistory) {
      if (historical.createdAt.getTime() < cutoffTime) {
        continue; // Outside uniqueness window
      }

      const similarity = this.calculatePuzzleSimilarity(puzzle, historical);
      if (similarity >= similarityThreshold) {
        similar.push(historical);
      }
    }

    return similar;
  }

  /**
   * Calculates similarity between two puzzles
   */
  private calculatePuzzleSimilarity(puzzle1: GeneratedPuzzle, puzzle2: GeneratedPuzzle): number {
    let score = 0;
    let factors = 0;

    // Type match (40%)
    if (puzzle1.type === puzzle2.type) {
      score += 0.4;
    }
    factors += 0.4;

    // Difficulty match (20%)
    if (puzzle1.difficulty === puzzle2.difficulty) {
      score += 0.2;
    }
    factors += 0.2;

    // Content similarity (25%)
    const contentSim = this.compareContent(puzzle1.content, puzzle2.content);
    score += contentSim * 0.25;
    factors += 0.25;

    // Solution similarity (15%)
    const solutionSim = this.compareSolutions(puzzle1.solution, puzzle2.solution);
    score += solutionSim * 0.15;
    factors += 0.15;

    return factors > 0 ? score / factors : 0;
  }

  /**
   * Compares content of two puzzles
   */
  private compareContent(content1: any, content2: any): number {
    try {
      const str1 = JSON.stringify(content1).substring(0, 200);
      const str2 = JSON.stringify(content2).substring(0, 200);

      if (str1 === str2) return 1.0;

      // Calculate string similarity
      const matches = this.stringSimilarity(str1, str2);
      return matches;
    } catch {
      return 0;
    }
  }

  /**
   * Compares solutions of two puzzles
   */
  private compareSolutions(solution1: any, solution2: any): number {
    try {
      if (JSON.stringify(solution1.answer) === JSON.stringify(solution2.answer)) {
        return 1.0;
      }
      return 0;
    } catch {
      return 0;
    }
  }

  /**
   * Simple string similarity calculation
   */
  private stringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calculates Levenshtein distance
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const track = Array(str2.length + 1)
      .fill(null)
      .map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i += 1) {
      track[0][i] = i;
    }
    for (let j = 0; j <= str2.length; j += 1) {
      track[j][0] = j;
    }

    for (let j = 1; j <= str2.length; j += 1) {
      for (let i = 1; i <= str1.length; i += 1) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        track[j][i] = Math.min(
          track[j][i - 1] + 1,
          track[j - 1][i] + 1,
          track[j - 1][i - 1] + indicator,
        );
      }
    }

    return track[str2.length][str1.length];
  }

  /**
   * Tracks variety for a specific puzzle type/difficulty
   */
  trackVariety(puzzle: GeneratedPuzzle): void {
    const key = `${puzzle.type}:${puzzle.difficulty}`;
    let tracker = this.varietyTrackers.get(key);

    if (!tracker) {
      tracker = {
        puzzleType: puzzle.type,
        difficulty: puzzle.difficulty,
        recentHashes: [],
        uniquenessScore: 1.0,
        lastGenerated: new Date(),
      };
      this.varietyTrackers.set(key, tracker);
    }

    const hash = this.generatePuzzleHash(puzzle);
    tracker.recentHashes.push(hash);

    // Keep only recent hashes (last 100)
    if (tracker.recentHashes.length > 100) {
      tracker.recentHashes = tracker.recentHashes.slice(-100);
    }

    // Calculate uniqueness score
    const uniqueHashes = new Set(tracker.recentHashes);
    tracker.uniquenessScore = uniqueHashes.size / tracker.recentHashes.length;
    tracker.lastGenerated = new Date();
  }

  /**
   * Gets variety tracker for puzzle type/difficulty
   */
  getVarietyTracker(puzzleType: PuzzleType, difficulty: DifficultyLevel): VarietyTracker | null {
    const key = `${puzzleType}:${difficulty}`;
    return this.varietyTrackers.get(key) || null;
  }

  /**
   * Calculates diversity metrics
   */
  calculateDiversityMetrics(
    puzzleType: PuzzleType,
    difficulty: DifficultyLevel,
  ): DiversityMetrics {
    const tracker = this.getVarietyTracker(puzzleType, difficulty);

    if (!tracker) {
      return {
        uniquenessToBucket: 1.0,
        diversityScore: 0.5,
        varietyScore: 0.5,
        freshness: 0.5,
      };
    }

    // Uniqueness to bucket
    const uniquenessToBucket = tracker.uniquenessScore;

    // Diversity score based on hash variety
    const uniqueHashes = new Set(tracker.recentHashes);
    const diversityScore = uniqueHashes.size / Math.max(1, tracker.recentHashes.length);

    // Variety score (combination of uniqueness and diversity)
    const varietyScore = (uniquenessToBucket + diversityScore) / 2;

    // Freshness based on time since last generation
    const timeSinceLastGen = Date.now() - tracker.lastGenerated.getTime();
    const freshnessThreshold = 60 * 60 * 1000; // 1 hour
    const freshness = Math.max(0, 1 - timeSinceLastGen / freshnessThreshold);

    return {
      uniquenessToBucket,
      diversityScore,
      varietyScore,
      freshness,
    };
  }

  /**
   * Recommends parameter variations for diversity
   */
  recommendParameterVariations(
    baseParams: Record<string, any>,
    diversityScore: number,
  ): Record<string, any>[] {
    const variations: Record<string, any>[] = [];

    // If diversity is low, generate more varied parameters
    const variationCount = diversityScore < 0.5 ? 5 : 3;

    for (let i = 0; i < variationCount; i++) {
      const variation = { ...baseParams };

      // Randomly adjust numeric parameters
      for (const [key, value] of Object.entries(baseParams)) {
        if (typeof value === 'number') {
          const factor = 0.7 + Math.random() * 0.6; // 0.7 to 1.3
          variation[key] = Math.round(value * factor);
        }
      }

      variations.push(variation);
    }

    return variations;
  }

  /**
   * Suggests puzzle type distribution for variety
   */
  suggestTypeDistribution(
    puzzleTypeCounts: Record<PuzzleType, number>,
    targetCount: number,
  ): Record<PuzzleType, number> {
    const types: PuzzleType[] = ['logic', 'pattern', 'math', 'word', 'visual'];
    const totalGenerated = Object.values(puzzleTypeCounts).reduce((a, b) => a + b, 0);

    // Calculate ideal distribution
    const ideal = Math.floor(targetCount / types.length);
    const distribution: Record<PuzzleType, number> = {} as any;

    for (const type of types) {
      const current = puzzleTypeCounts[type] || 0;
      const shouldGenerate = Math.max(0, ideal - current);
      distribution[type] = shouldGenerate;
    }

    return distribution;
  }

  /**
   * Validates puzzle freshness
   */
  isFresh(puzzle: GeneratedPuzzle): boolean {
    const ageMs = Date.now() - puzzle.createdAt.getTime();
    const freshnessThreshold = 7 * 24 * 60 * 60 * 1000; // 7 days

    return ageMs < freshnessThreshold;
  }

  /**
   * Generates variety report
   */
  generateVarietyReport(): string {
    let report = '=== PUZZLE VARIETY REPORT ===\n\n';

    report += `Total Puzzles Generated: ${this.generationHistory.length}\n`;
    report += `Total Unique Puzzles: ${this.puzzleHashes.size}\n\n`;

    report += 'VARIETY BY TYPE AND DIFFICULTY:\n';
    this.varietyTrackers.forEach((tracker, key) => {
      const [type, difficulty] = key.split(':');
      const uniqueHashes = new Set(tracker.recentHashes);
      report += `  ${type} (${difficulty}): ${uniqueHashes.size} unique / ${tracker.recentHashes.length} total\n`;
      report += `    Uniqueness Score: ${tracker.uniquenessScore.toFixed(2)}\n`;
    });

    report += '\nRECENT GENERATION HISTORY:\n';
    const recent = this.generationHistory.slice(-10);
    recent.forEach((puzzle) => {
      report += `  ${puzzle.id.substring(0, 8)}... - ${puzzle.type} (${puzzle.difficulty})\n`;
    });

    return report;
  }

  /**
   * Trims history to maintain size limits
   */
  private trimHistory(): void {
    if (this.generationHistory.length > this.maxHistorySize) {
      const excess = this.generationHistory.length - this.maxHistorySize;
      this.generationHistory.splice(0, excess);

      // Also clean up old hashes
      const cutoffTime = Date.now() - this.uniquenessWindow;
      this.generationHistory.forEach((puzzle) => {
        if (puzzle.createdAt.getTime() < cutoffTime) {
          const hash = this.generatePuzzleHash(puzzle);
          this.puzzleHashes.delete(hash);
        }
      });
    }
  }

  /**
   * Resets variety tracking
   */
  resetVarietyTracking(): void {
    this.varietyTrackers.clear();
    this.puzzleHashes.clear();
    this.generationHistory.length = 0;
  }

  /**
   * Gets uniqueness statistics
   */
  getUniquenessStatistics(): {
    avgUniquenessScore: number;
    bucketCount: number;
    totalUnique: number;
    duplicateRate: number;
  } {
    if (this.varietyTrackers.size === 0) {
      return {
        avgUniquenessScore: 0,
        bucketCount: 0,
        totalUnique: 0,
        duplicateRate: 0,
      };
    }

    const scores = Array.from(this.varietyTrackers.values()).map((t) => t.uniquenessScore);
    const avgUniquenessScore = scores.reduce((a, b) => a + b, 0) / scores.length;

    const totalUnique = this.puzzleHashes.size;
    const duplicateRate = Math.max(
      0,
      1 - totalUnique / Math.max(1, this.generationHistory.length),
    );

    return {
      avgUniquenessScore,
      bucketCount: this.varietyTrackers.size,
      totalUnique,
      duplicateRate,
    };
  }
}
