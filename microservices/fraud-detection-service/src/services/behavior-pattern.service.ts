import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { BehaviorPattern, PatternType } from '../entities/behavior-pattern.entity';
import { RecordBehaviorEventDto } from '../dto/behavior.dto';

export interface PatternSummary {
  playerId: string;
  patternType: PatternType;
  mean: number;
  stdDev: number;
  sampleCount: number;
  latestFeatures: Record<string, number>;
  windowStart: Date;
  windowEnd: Date;
}

@Injectable()
export class BehaviorPatternService {
  private readonly logger = new Logger(BehaviorPatternService.name);

  constructor(
    @InjectRepository(BehaviorPattern)
    private readonly patternRepo: Repository<BehaviorPattern>,
  ) {}

  /**
   * Record a new behavioral event and update the rolling window statistics
   * using online Welford's algorithm for mean/stddev computation.
   */
  async recordEvent(dto: RecordBehaviorEventDto): Promise<BehaviorPattern> {
    const windowMinutes = 60;
    const now = new Date();
    const windowStart = new Date(now.getTime() - windowMinutes * 60 * 1000);

    // Find existing pattern record for this player+type within the window
    let pattern = await this.patternRepo.findOne({
      where: {
        playerId: dto.playerId,
        patternType: dto.patternType,
        windowStart: MoreThan(windowStart),
      },
      order: { windowStart: 'DESC' },
    });

    if (!pattern) {
      // Start a new window
      const primaryMetricKey = Object.keys(dto.features)[0];
      const initialValue = dto.features[primaryMetricKey] ?? 0;

      pattern = this.patternRepo.create({
        playerId: dto.playerId,
        patternType: dto.patternType,
        features: dto.features,
        mean: initialValue,
        stdDev: 0,
        sampleCount: 1,
        windowStart: now,
        windowEnd: now,
      });
    } else {
      // Update existing window using Welford's online algorithm
      const primaryMetricKey = Object.keys(dto.features)[0];
      const newValue = dto.features[primaryMetricKey] ?? 0;

      const n = pattern.sampleCount + 1;
      const delta = newValue - pattern.mean;
      const newMean = pattern.mean + delta / n;
      const delta2 = newValue - newMean;
      // Running variance (M2) stored in stdDev temporarily, finalised below
      const prevM2 = pattern.stdDev * pattern.stdDev * (pattern.sampleCount > 1 ? pattern.sampleCount - 1 : 1);
      const newM2 = prevM2 + delta * delta2;
      const newStdDev = n > 1 ? Math.sqrt(newM2 / (n - 1)) : 0;

      pattern.mean = newMean;
      pattern.stdDev = newStdDev;
      pattern.sampleCount = n;
      pattern.features = { ...pattern.features, ...dto.features };
      pattern.windowEnd = now;
    }

    return this.patternRepo.save(pattern);
  }

  /**
   * Get pattern summaries for a player over a given time window.
   */
  async getPlayerPatterns(
    playerId: string,
    windowMinutes = 60,
  ): Promise<PatternSummary[]> {
    const since = new Date(Date.now() - windowMinutes * 60 * 1000);

    const patterns = await this.patternRepo.find({
      where: { playerId, windowStart: MoreThan(since) },
      order: { windowStart: 'DESC' },
    });

    return patterns.map((p) => ({
      playerId: p.playerId,
      patternType: p.patternType,
      mean: Number(p.mean),
      stdDev: Number(p.stdDev),
      sampleCount: p.sampleCount,
      latestFeatures: p.features,
      windowStart: p.windowStart,
      windowEnd: p.windowEnd,
    }));
  }

  /**
   * Check velocity: count actions in the last N minutes.
   * Returns true if action count exceeds maxAllowed.
   */
  async checkVelocity(
    playerId: string,
    patternType: PatternType,
    windowMinutes: number,
    maxAllowed: number,
  ): Promise<{ exceeded: boolean; count: number }> {
    const since = new Date(Date.now() - windowMinutes * 60 * 1000);

    const count = await this.patternRepo.count({
      where: { playerId, patternType, windowStart: MoreThan(since) },
    });

    return { exceeded: count > maxAllowed, count };
  }

  /**
   * Detect if a player's action timing is robotic (too regular, very low variance).
   * Human players have natural variance in timing; bots are unnaturally consistent.
   */
  async detectBotBehavior(
    playerId: string,
    windowMinutes = 30,
  ): Promise<{ suspicious: boolean; confidence: number; reason: string }> {
    const patterns = await this.getPlayerPatterns(playerId, windowMinutes);
    const timingPattern = patterns.find(
      (p) => p.patternType === PatternType.SESSION_TIMING,
    );

    if (!timingPattern || timingPattern.sampleCount < 10) {
      return { suspicious: false, confidence: 0, reason: 'insufficient data' };
    }

    const coefficientOfVariation =
      timingPattern.mean > 0 ? timingPattern.stdDev / timingPattern.mean : 1;

    // Bots tend to have extremely low CV (< 0.05), humans typically > 0.2
    const suspicious = coefficientOfVariation < 0.05;
    const confidence = suspicious
      ? Math.min(1, (0.05 - coefficientOfVariation) / 0.05)
      : 0;

    return {
      suspicious,
      confidence,
      reason: suspicious
        ? `Timing CV=${coefficientOfVariation.toFixed(4)} is below human threshold`
        : 'Timing variance is within human norms',
    };
  }
}
