import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { CheatViolation } from '../entities/cheat-violation.entity';
import { PlayerBehaviorProfile } from '../entities/player-behavior-profile.entity';
import { PuzzleMoveAudit } from '../entities/puzzle-move-audit.entity';
import { DetectionService, type DetectionViolation } from './detection.service';
import { ViolationType, Severity, ViolationStatus } from '../constants';
import type { PuzzleMove, ValidationResult } from '../../game-engine/types/puzzle.types';
import type { AntiCheatConfig } from '../config/anti-cheat.config';

/**
 * Main anti-cheat orchestration service
 * Coordinates violation detection, recording, and management
 */
@Injectable()
export class AntiCheatService {
  private readonly logger = new Logger(AntiCheatService.name);
  private readonly config: AntiCheatConfig;

  constructor(
    @InjectRepository(CheatViolation)
    private readonly violationRepo: Repository<CheatViolation>,
    @InjectRepository(PlayerBehaviorProfile)
    private readonly profileRepo: Repository<PlayerBehaviorProfile>,
    @InjectRepository(PuzzleMoveAudit)
    private readonly auditRepo: Repository<PuzzleMoveAudit>,
    private readonly detectionService: DetectionService,
    private readonly configService: ConfigService
  ) {
    this.config = this.configService.get<AntiCheatConfig>('antiCheat')!;
  }

  /**
   * Analyze a move and audit it for suspicious patterns
   */
  async auditMove(
    playerId: string,
    puzzleId: string,
    sessionId: string,
    move: PuzzleMove,
    moveNumber: number,
    timeSincePrevious: number,
    validationResult: ValidationResult
  ): Promise<void> {
    try {
      // Check if we should log this move
      const shouldLog = this.config.logging.logAllMoves || this.config.logging.logSuspiciousMoves;

      if (!shouldLog) {
        return;
      }

      // Create audit record
      const audit = this.auditRepo.create({
        playerId,
        puzzleId,
        sessionId,
        moveData: move,
        moveNumber,
        timeSincePreviousMove: timeSincePrevious,
        wasValid: validationResult.isValid,
        validationResult,
        flaggedAsSuspicious: false,
        suspicionReasons: null
      });

      await this.auditRepo.save(audit);

      this.logger.debug(`Audited move ${moveNumber} for player ${playerId} in puzzle ${puzzleId}`);
    } catch (error: any) {
      this.logger.error(`Failed to audit move: ${error.message}`, error.stack);
    }
  }

  /**
   * Analyze a sequence of moves for cheating patterns
   */
  async analyzeMoveSequence(
    playerId: string,
    puzzleId: string,
    sessionId: string,
    moves: PuzzleMove[],
    context: {
      isFirstAttempt: boolean;
      optimalMoveCount?: number;
      allMovesValid: boolean;
    }
  ): Promise<void> {
    try {
      // Run detection algorithms
      const result = this.detectionService.analyzeMoveSequence(moves, context);

      if (result.isAnomaly && result.violations.length > 0) {
        this.logger.warn(
          `Detected ${result.violations.length} anomalies for player ${playerId} in puzzle ${puzzleId}`
        );

        // Record violations
        for (const violation of result.violations) {
          await this.recordViolation(playerId, puzzleId, sessionId, violation);
        }

        // Update player's behavior profile
        await this.updateBehaviorProfile(playerId, {
          violationDetected: true,
          violationTypes: result.violations.map(v => v.type)
        });
      }
    } catch (error: any) {
      this.logger.error(`Failed to analyze move sequence: ${error.message}`, error.stack);
    }
  }

  /**
   * Record a detected violation
   */
  async recordViolation(
    playerId: string,
    puzzleId: string,
    sessionId: string,
    violation: DetectionViolation
  ): Promise<CheatViolation> {
    const shadowMode = this.config.shadowMode.enabled;

    const cheatViolation = this.violationRepo.create({
      playerId,
      puzzleId,
      sessionId,
      violationType: violation.type,
      severity: violation.severity,
      confidenceScore: violation.confidenceScore,
      evidence: violation.evidence,
      status: ViolationStatus.PENDING,
      autoDetected: true,
      actionTaken: false
    });

    const saved = await this.violationRepo.save(cheatViolation);

    if (shadowMode) {
      this.logger.warn(
        `[SHADOW MODE] Violation detected but not enforced: ${violation.type} for player ${playerId}`,
        { violationId: saved.id, severity: violation.severity }
      );
    } else {
      this.logger.warn(
        `Violation recorded: ${violation.type} for player ${playerId}`,
        { violationId: saved.id, severity: violation.severity }
      );
    }

    return saved;
  }

  /**
   * Check rate limiting for puzzle attempts
   */
  async checkRateLimit(playerId: string, puzzleId: string): Promise<{ passed: boolean; reason?: string }> {
    // Get recent move audits for this player
    const oneSecondAgo = new Date(Date.now() - 1000);

    const recentMoves = await this.auditRepo.count({
      where: {
        playerId,
        createdAt: MoreThan(oneSecondAgo)
      }
    });

    if (recentMoves >= this.config.thresholds.maxMovesPerSecond) {
      return {
        passed: false,
        reason: `Rate limit exceeded: ${recentMoves} moves in last second`
      };
    }

    return { passed: true };
  }

  /**
   * Validate move timestamp for clock manipulation
   */
  validateMoveTimestamp(move: PuzzleMove): { passed: boolean; reason?: string } {
    const now = Date.now();
    const moveTime = new Date(move.timestamp).getTime();
    const drift = Math.abs(now - moveTime);

    // Allow 5 second drift for client/server time differences
    if (drift > 5000) {
      return {
        passed: false,
        reason: `Timestamp drift too large: ${drift}ms`
      };
    }

    // Check for future timestamps
    if (moveTime > now + 1000) {
      return {
        passed: false,
        reason: 'Move timestamp is in the future'
      };
    }

    return { passed: true };
  }

  /**
   * Check session integrity
   */
  async checkSessionIntegrity(headers: Record<string, any>): Promise<{ passed: boolean; reason?: string }> {
    // Basic session integrity checks
    // In a production system, this would check for:
    // - Session hijacking
    // - Multiple concurrent sessions
    // - Suspicious user agent changes
    // - IP address changes

    return { passed: true };
  }

  /**
   * Get or create player behavior profile
   */
  async getOrCreateProfile(playerId: string): Promise<PlayerBehaviorProfile> {
    let profile = await this.profileRepo.findOne({ where: { playerId } });

    if (!profile) {
      profile = this.profileRepo.create({
        playerId,
        timingProfile: {
          avgTimeBetweenMoves: 0,
          stdDevTimeBetweenMoves: 0,
          fastestMove: Number.MAX_SAFE_INTEGER,
          slowestMove: 0,
          typicalPausePattern: []
        },
        accuracyProfile: {
          overallAccuracy: 0,
          firstAttemptAccuracy: 0,
          improvementRate: 0,
          errorPatterns: {}
        },
        skillProfile: {
          skillLevel: 5,
          strongPuzzleTypes: [],
          weakPuzzleTypes: [],
          learningCurve: 0,
          consistencyScore: 0
        },
        sessionPatterns: {
          avgSessionDuration: 0,
          puzzlesPerSession: 0,
          preferredPlayTimes: [],
          multitaskingIndicators: 0
        },
        riskFactors: {
          overallRiskScore: 0,
          flaggedBehaviors: [],
          suspiciousPatterns: []
        },
        totalPuzzlesCompleted: 0,
        totalViolations: 0,
        confirmedViolations: 0,
        trustScore: this.config.thresholds.initialTrustScore
      });

      profile = await this.profileRepo.save(profile);
      this.logger.log(`Created behavior profile for player ${playerId}`);
    }

    return profile;
  }

  /**
   * Update player behavior profile
   */
  async updateBehaviorProfile(
    playerId: string,
    update: {
      violationDetected?: boolean;
      violationTypes?: ViolationType[];
    }
  ): Promise<void> {
    try {
      const profile = await this.getOrCreateProfile(playerId);

      if (update.violationDetected) {
        profile.totalViolations += 1;

        // Update risk factors
        if (update.violationTypes && update.violationTypes.length > 0) {
          profile.riskFactors.flaggedBehaviors = [
            ...new Set([...profile.riskFactors.flaggedBehaviors, ...update.violationTypes])
          ];
        }

        // Decay trust score based on violation severity
        // For now, we'll use a simple decay (can be enhanced based on severity)
        const decay = 5; // LOW severity decay
        profile.trustScore = Math.max(
          this.config.thresholds.minTrustScore,
          profile.trustScore - decay
        );

        profile.lastViolationAt = new Date();
      }

      await this.profileRepo.save(profile);
      this.logger.debug(`Updated behavior profile for player ${playerId}`);
    } catch (error: any) {
      this.logger.error(`Failed to update behavior profile: ${error.message}`, error.stack);
    }
  }

  /**
   * Get violation statistics for a player
   */
  async getPlayerViolations(playerId: string): Promise<CheatViolation[]> {
    return this.violationRepo.find({
      where: { playerId },
      order: { createdAt: 'DESC' }
    });
  }

  /**
   * Get recent move audits for a player/puzzle
   */
  async getRecentMoves(playerId: string, puzzleId: string, sessionId: string): Promise<PuzzleMoveAudit[]> {
    return this.auditRepo.find({
      where: { playerId, puzzleId, sessionId },
      order: { moveNumber: 'ASC' }
    });
  }
}
