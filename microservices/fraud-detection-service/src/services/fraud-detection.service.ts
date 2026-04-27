import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BehaviorPatternService } from './behavior-pattern.service';
import { AnomalyDetectionService } from './anomaly-detection.service';
import { FraudRuleEngine } from './fraud-rule-engine.service';
import { FraudAlertService } from './fraud-alert.service';
import { AccountFlagService } from './account-flag.service';
import { RecordBehaviorEventDto } from '../dto/behavior.dto';
import { RuleAction } from '../entities/fraud-rule.entity';
import { FlagType } from '../entities/account-flag.entity';
import { AlertType } from '../entities/fraud-alert.entity';

export interface FraudCheckRequest {
  playerId: string;
  metrics: Record<string, number>;   // e.g. { actionsPerMinute: 45, scorePerSession: 200 }
  context?: Record<string, any>;
}

export interface FraudCheckResult {
  playerId: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  anomalyCount: number;
  firedRulesCount: number;
  actionsTaken: string[];
  isSuspended: boolean;
}

@Injectable()
export class FraudDetectionService {
  private readonly logger = new Logger(FraudDetectionService.name);

  private readonly RISK_THRESHOLD_ALERT: number;
  private readonly RISK_THRESHOLD_SUSPEND: number;

  constructor(
    private readonly behaviorPatternService: BehaviorPatternService,
    private readonly anomalyDetectionService: AnomalyDetectionService,
    private readonly fraudRuleEngine: FraudRuleEngine,
    private readonly fraudAlertService: FraudAlertService,
    private readonly accountFlagService: AccountFlagService,
  ) {
    this.RISK_THRESHOLD_ALERT = parseInt(process.env.RISK_THRESHOLD_ALERT ?? '60', 10);
    this.RISK_THRESHOLD_SUSPEND = parseInt(process.env.RISK_THRESHOLD_SUSPEND ?? '85', 10);
  }

  /**
   * Main entry point: run a full fraud check pipeline for a player.
   * 1. Compute risk score from anomalies
   * 2. Evaluate rule engine
   * 3. Execute actions (alert, flag, suspend)
   */
  async runFraudCheck(req: FraudCheckRequest): Promise<FraudCheckResult> {
    const { playerId, metrics } = req;

    // Step 1: Compute anomaly-based risk score
    const riskScore = await this.anomalyDetectionService.computeRiskScore(playerId);

    // Merge anomaly score into metrics for rule evaluation
    const enrichedMetrics = { ...metrics, riskScore: riskScore.score };

    // Step 2: Rule engine evaluation
    const ruleResult = await this.fraudRuleEngine.evaluate(playerId, enrichedMetrics);

    // Step 3: Combine scores
    const combinedScore = Math.min(
      100,
      riskScore.score + Math.min(50, ruleResult.totalRiskPoints),
    );

    // Update stored risk score
    await this.accountFlagService.updateRiskScore(playerId, combinedScore);

    const actionsTaken: string[] = [];
    const actions = ruleResult.actions;

    // Step 4: Execute actions
    if (combinedScore >= this.RISK_THRESHOLD_ALERT || actions.has(RuleAction.ALERT)) {
      await this.fraudAlertService.processRiskScore({ ...riskScore, score: combinedScore });
      actionsTaken.push('alert_created');
    }

    if (actions.has(RuleAction.FLAG) || combinedScore >= 40) {
      await this.accountFlagService.flagAccount(
        playerId,
        FlagType.SUSPICIOUS,
        'system',
        `Auto-flagged: score=${combinedScore}, rules_fired=${ruleResult.firedRules.length}`,
      );
      actionsTaken.push('account_flagged');
    }

    if (actions.has(RuleAction.REQUIRE_REVIEW)) {
      await this.fraudAlertService.addToReviewQueue(
        playerId,
        null,
        `Rule engine required review: ${ruleResult.firedRules.map((r) => r.rule.name).join(', ')}`,
        { firedRules: ruleResult.firedRules.map((r) => r.rule.name), metrics },
        combinedScore >= 85 ? 'critical' as any : 'high' as any,
      );
      actionsTaken.push('queued_for_review');
    }

    if (combinedScore >= this.RISK_THRESHOLD_SUSPEND || actions.has(RuleAction.SUSPEND)) {
      await this.accountFlagService.suspendAccount(playerId, 'system', {
        reason: `Auto-suspended: risk score ${combinedScore}/100`,
        durationHours: combinedScore >= 95 ? undefined : 24, // permanent if >=95
      });

      await this.fraudAlertService.createAlert(
        playerId,
        AlertType.RULE_VIOLATION,
        combinedScore,
        `Account auto-suspended: risk score ${combinedScore}`,
        { triggeredBy: ruleResult.firedRules.map((r) => r.rule.name) },
      );

      actionsTaken.push('account_suspended');
    }

    const isSuspended = await this.accountFlagService.isAccountSuspended(playerId);

    this.logger.log(
      `Fraud check complete: player=${playerId} score=${combinedScore} actions=[${actionsTaken.join(',')}]`,
    );

    return {
      playerId,
      riskScore: combinedScore,
      riskLevel: riskScore.level,
      anomalyCount: riskScore.anomalies.length,
      firedRulesCount: ruleResult.firedRules.length,
      actionsTaken,
      isSuspended,
    };
  }

  /**
   * Record a behavioural event and trigger incremental anomaly analysis.
   */
  async recordAndAnalyze(dto: RecordBehaviorEventDto): Promise<void> {
    await this.behaviorPatternService.recordEvent(dto);

    const patterns = await this.behaviorPatternService.getPlayerPatterns(dto.playerId, 60);
    await this.anomalyDetectionService.analyzePatterns(dto.playerId, patterns);
  }

  /**
   * Periodic cleanup: lift temporary suspensions that have expired.
   * Runs every 15 minutes.
   */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async expireTemporarySuspensions(): Promise<void> {
    this.logger.debug('Running temporary suspension expiry job');
    // Delegated to AccountFlagService via isAccountSuspended's auto-expiry logic.
    // A proper production implementation would do a bulk query; this is a placeholder.
  }
}
