/**
 * Generation Performance Optimization and Caching System
 * Handles caching, batch generation, and performance optimization
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  GeneratedPuzzle,
  GenerationConfig,
  PuzzleType,
  DifficultyLevel,
  CacheEntry,
} from './types';

interface PerformanceStats {
  totalGenerated: number;
  cacheHits: number;
  cacheMisses: number;
  avgGenerationTime: number;
  avgValidationTime: number;
  cacheHitRate: number;
  memoryUsage: number;
  batchProcessingTime?: number;
}

interface BatchGenerationConfig {
  count: number;
  puzzleType: PuzzleType;
  difficulty: DifficultyLevel;
  parallel: boolean;
  batchSize?: number;
}

@Injectable()
export class PerformanceOptimizationService {
  private readonly logger = new Logger(PerformanceOptimizationService.name);

  private readonly cache: Map<string, CacheEntry> = new Map();
  private readonly maxCacheSize = 10000;
  private readonly defaultTTL = 60 * 60 * 1000; // 1 hour
  private readonly stats: PerformanceStats = {
    totalGenerated: 0,
    cacheHits: 0,
    cacheMisses: 0,
    avgGenerationTime: 0,
    avgValidationTime: 0,
    cacheHitRate: 0,
    memoryUsage: 0,
  };
  private generationTimes: number[] = [];
  private validationTimes: number[] = [];
  private readonly maxHistorySize = 100;

  /**
   * Retrieves cached puzzle or null
   */
  getFromCache(key: string): GeneratedPuzzle | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.cacheMisses++;
      this.updateCacheHitRate();
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp.getTime() > entry.ttl) {
      this.cache.delete(key);
      this.stats.cacheMisses++;
      this.updateCacheHitRate();
      return null;
    }

    entry.hits++;
    entry.usageCount++;
    this.stats.cacheHits++;
    this.updateCacheHitRate();

    return entry.puzzle;
  }

  /**
   * Stores puzzle in cache
   */
  storeInCache(key: string, puzzle: GeneratedPuzzle, ttl: number = this.defaultTTL): void {
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.maxCacheSize) {
      this.evictLRU();
    }

    this.cache.set(key, {
      puzzle,
      timestamp: new Date(),
      ttl,
      hits: 0,
      usageCount: 0,
    });

    this.updateMemoryUsage();
  }

  /**
   * Generates cache key from config
   */
  generateCacheKey(config: GenerationConfig): string {
    const key = `${config.puzzleType}:${config.difficulty}:${JSON.stringify(
      config.parameters,
    )}:${config.seed || 'noseed'}`;

    return Buffer.from(key).toString('base64');
  }

  /**
   * Performs batch generation
   */
  async performBatchGeneration(
    config: BatchGenerationConfig,
  ): Promise<{
    puzzles: GeneratedPuzzle[];
    stats: {
      totalTime: number;
      avgTimePerPuzzle: number;
      successCount: number;
      failureCount: number;
    };
  }> {
    const startTime = Date.now();
    const puzzles: GeneratedPuzzle[] = [];
    let successCount = 0;
    let failureCount = 0;

    if (config.parallel) {
      // Parallel batch generation
      const batchSize = config.batchSize || 10;
      for (let i = 0; i < config.count; i += batchSize) {
        const batchEnd = Math.min(i + batchSize, config.count);
        const batchPromises = [];

        for (let j = i; j < batchEnd; j++) {
          // Simulate parallel generation
          const promise = this.simulatePuzzleGeneration(config, j);
          batchPromises.push(promise);
        }

        const batchResults = await Promise.all(batchPromises);
        for (const result of batchResults) {
          if (result) {
            puzzles.push(result);
            successCount++;
          } else {
            failureCount++;
          }
        }
      }
    } else {
      // Sequential batch generation
      for (let i = 0; i < config.count; i++) {
        const puzzle = await this.simulatePuzzleGeneration(config, i);
        if (puzzle) {
          puzzles.push(puzzle);
          successCount++;
        } else {
          failureCount++;
        }
      }
    }

    const totalTime = Date.now() - startTime;
    this.stats.batchProcessingTime = totalTime;

    return {
      puzzles,
      stats: {
        totalTime,
        avgTimePerPuzzle: totalTime / config.count,
        successCount,
        failureCount,
      },
    };
  }

  /**
   * Simulates puzzle generation (placeholder)
   */
  private async simulatePuzzleGeneration(
    config: BatchGenerationConfig,
    index: number,
  ): Promise<GeneratedPuzzle | null> {
    // Simulate generation delay
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 100));

    // Return mock puzzle
    return {
      id: `puzzle-${index}`,
      type: config.puzzleType,
      difficulty: config.difficulty,
      difficultyRating: 5,
      title: `Generated Puzzle ${index}`,
      description: `Batch generated puzzle`,
      content: { puzzle: {}, format: 'json' },
      solution: { answer: 'solution', explanation: 'Explanation' },
      hints: ['Hint 1'],
      timeLimit: 300,
      basePoints: 100,
      metadata: {
        generationMethod: 'BatchGeneration',
        generatedAt: new Date(),
        seed: Math.floor(Math.random() * 1000000),
        parameterSignature: '',
        qualityMetrics: {
          complexity: 0.5,
          uniqueness: 0.5,
          clarity: 0.8,
          solvability: 0.9,
          engagementPotential: 0.7,
        },
        solvabilityScore: 0.9,
        engagementScore: 0.75,
      },
      validationScore: 0.85,
      createdAt: new Date(),
    };
  }

  /**
   * Records generation time
   */
  recordGenerationTime(timeMs: number): void {
    this.generationTimes.push(timeMs);
    if (this.generationTimes.length > this.maxHistorySize) {
      this.generationTimes.shift();
    }

    // Update average
    this.stats.avgGenerationTime =
      this.generationTimes.reduce((a, b) => a + b, 0) / this.generationTimes.length;
    this.stats.totalGenerated++;
  }

  /**
   * Records validation time
   */
  recordValidationTime(timeMs: number): void {
    this.validationTimes.push(timeMs);
    if (this.validationTimes.length > this.maxHistorySize) {
      this.validationTimes.shift();
    }

    // Update average
    this.stats.avgValidationTime =
      this.validationTimes.reduce((a, b) => a + b, 0) / this.validationTimes.length;
  }

  /**
   * Gets current performance statistics
   */
  getPerformanceStats(): PerformanceStats {
    return { ...this.stats };
  }

  /**
   * Generates performance report
   */
  generatePerformanceReport(): string {
    let report = '=== GENERATION PERFORMANCE REPORT ===\n\n';

    report += 'CACHE STATISTICS:\n';
    report += `  Total Entries: ${this.cache.size}\n`;
    report += `  Hits: ${this.stats.cacheHits}\n`;
    report += `  Misses: ${this.stats.cacheMisses}\n`;
    report += `  Hit Rate: ${(this.stats.cacheHitRate * 100).toFixed(2)}%\n`;
    report += `  Memory Usage: ${this.stats.memoryUsage}MB\n\n`;

    report += 'GENERATION PERFORMANCE:\n';
    report += `  Total Generated: ${this.stats.totalGenerated}\n`;
    report += `  Avg Generation Time: ${this.stats.avgGenerationTime.toFixed(2)}ms\n`;
    report += `  Avg Validation Time: ${this.stats.avgValidationTime.toFixed(2)}ms\n`;
    if (this.stats.batchProcessingTime !== undefined) {
      report += `  Latest Batch Processing: ${this.stats.batchProcessingTime}ms\n`;
    }

    report += '\nGENERATION TIME TREND:\n';
    const recent = this.generationTimes.slice(-10);
    if (recent.length > 0) {
      report += `  Last 10 Times: ${recent.map((t) => t.toFixed(0)).join(', ')}ms\n`;
      report += `  Trend: ${recent[recent.length - 1] < recent[0] ? '⬇ Improving' : '⬆ Degrading'}\n`;
    }

    return report;
  }

  /**
   * Optimizes cache for memory
   */
  optimizeCache(): {
    removed: number;
    freed: number;
  } {
    const initialSize = this.cache.size;
    let removed = 0;
    let freed = 0;

    // Remove expired entries
    for (const [key, entry] of this.cache.entries()) {
      if (Date.now() - entry.timestamp.getTime() > entry.ttl) {
        this.cache.delete(key);
        removed++;
        freed += this.estimateEntrySize(entry);
      }
    }

    // Remove least used entries if still too large
    if (this.cache.size > this.maxCacheSize * 0.8) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].usageCount - b[1].usageCount);

      const toRemove = Math.floor(entries.length * 0.2);
      for (let i = 0; i < toRemove; i++) {
        const [key, entry] = entries[i];
        this.cache.delete(key);
        removed++;
        freed += this.estimateEntrySize(entry);
      }
    }

    this.updateMemoryUsage();

    return { removed, freed };
  }

  /**
   * Clears all cache
   */
  clearCache(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.logger.log(`Cache cleared: ${size} entries removed`);
  }

  /**
   * Estimates size of cache entry in MB
   */
  private estimateEntrySize(entry: CacheEntry): number {
    const puzzleStr = JSON.stringify(entry.puzzle);
    return puzzleStr.length / (1024 * 1024);
  }

  /**
   * Updates memory usage estimate
   */
  private updateMemoryUsage(): void {
    let totalSize = 0;
    for (const entry of this.cache.values()) {
      totalSize += this.estimateEntrySize(entry);
    }
    this.stats.memoryUsage = totalSize;
  }

  /**
   * Updates cache hit rate
   */
  private updateCacheHitRate(): void {
    const total = this.stats.cacheHits + this.stats.cacheMisses;
    this.stats.cacheHitRate = total > 0 ? this.stats.cacheHits / total : 0;
  }

  /**
   * Evicts least recently used entry
   */
  private evictLRU(): void {
    let lruKey = '';
    let lruHits = Infinity;
    let lruTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.hits < lruHits || (entry.hits === lruHits && entry.timestamp.getTime() < lruTime)) {
        lruKey = key;
        lruHits = entry.hits;
        lruTime = entry.timestamp.getTime();
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
    }
  }

  /**
   * Gets cache diagnostics
   */
  getCacheDiagnostics(): {
    totalSize: number;
    maxSize: number;
    utilizationPercent: number;
    oldestEntry?: Date;
    newestEntry?: Date;
    avgEntryAge: number;
  } {
    const entries = Array.from(this.cache.values());

    if (entries.length === 0) {
      return {
        totalSize: 0,
        maxSize: this.maxCacheSize,
        utilizationPercent: 0,
        avgEntryAge: 0,
      };
    }

    const timestamps = entries.map((e) => e.timestamp.getTime());
    const oldestEntry = new Date(Math.min(...timestamps));
    const newestEntry = new Date(Math.max(...timestamps));

    const avgEntryAge = (Date.now() - timestamps.reduce((a, b) => a + b, 0) / timestamps.length) / 1000 / 60; // in minutes

    return {
      totalSize: entries.length,
      maxSize: this.maxCacheSize,
      utilizationPercent: (entries.length / this.maxCacheSize) * 100,
      oldestEntry,
      newestEntry,
      avgEntryAge,
    };
  }

  /**
   * Analyzes generation performance bottlenecks
   */
  analyzeBottlenecks(): {
    bottleneck: string;
    recommendation: string;
    severity: 'low' | 'medium' | 'high';
  }[] {
    const bottlenecks: {
      bottleneck: string;
      recommendation: string;
      severity: 'low' | 'medium' | 'high';
    }[] = [];

    // Check cache hit rate
    if (this.stats.cacheHitRate < 0.3 && this.stats.totalGenerated > 100) {
      bottlenecks.push({
        bottleneck: 'Low cache hit rate',
        recommendation: 'Consider increasing cache TTL or size',
        severity: 'medium',
      });
    }

    // Check generation time
    if (this.stats.avgGenerationTime > 1000) {
      bottlenecks.push({
        bottleneck: 'Slow puzzle generation',
        recommendation: 'Optimize generation algorithm or use simpler parameters',
        severity: 'high',
      });
    }

    // Check validation time
    if (this.stats.avgValidationTime > 500) {
      bottlenecks.push({
        bottleneck: 'Slow validation',
        recommendation: 'Optimize validation checks or run in parallel',
        severity: 'medium',
      });
    }

    // Check memory usage
    if (this.stats.memoryUsage > 500) {
      bottlenecks.push({
        bottleneck: 'High memory usage',
        recommendation: 'Run cache optimization or reduce cache size',
        severity: 'high',
      });
    }

    // Check total generation time
    const totalAvgTime = this.stats.avgGenerationTime + this.stats.avgValidationTime;
    if (totalAvgTime > 1500) {
      bottlenecks.push({
        bottleneck: 'Total generation pipeline slow',
        recommendation: 'Parallelize generation and validation',
        severity: 'high',
      });
    }

    return bottlenecks;
  }
}
