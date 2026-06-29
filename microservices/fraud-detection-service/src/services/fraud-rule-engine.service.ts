import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  FraudRule,
  RuleAction,
  RuleConditionOperator,
} from '../entities/fraud-rule.entity';
import { CreateRuleDto } from '../dto/fraud.dto';

export interface RuleEvaluationResult {
  rule: FraudRule;
  fired: boolean;
  observedValue: number;
  riskPoints: number;
}

export interface RuleEngineResult {
  playerId: string;
  firedRules: RuleEvaluationResult[];
  totalRiskPoints: number;
  actions: Set<RuleAction>;
  evaluatedAt: Date;
}

@Injectable()
export class FraudRuleEngine {
  private readonly logger = new Logger(FraudRuleEngine.name);

  constructor(
    @InjectRepository(FraudRule)
    private readonly ruleRepo: Repository<FraudRule>,
  ) {}

  // ── Rule management ───────────────────────────────────────────────────────

  async createRule(dto: CreateRuleDto): Promise<FraudRule> {
    const rule = this.ruleRepo.create({
      name: dto.name,
      description: dto.description,
      metric: dto.metric,
      operator: dto.operator,
      threshold: dto.threshold,
      action: dto.action,
      riskPoints: dto.riskPoints ?? 20,
      priority: dto.priority ?? 50,
      isActive: true,
    });
    return this.ruleRepo.save(rule);
  }

  async getActiveRules(): Promise<FraudRule[]> {
    return this.ruleRepo.find({
      where: { isActive: true },
      order: { priority: 'DESC' },
    });
  }

  async toggleRule(ruleId: string, isActive: boolean): Promise<FraudRule> {
    await this.ruleRepo.update(ruleId, { isActive });
    return this.ruleRepo.findOne({ where: { id: ruleId } });
  }

  async seedDefaultRules(): Promise<void> {
    const count = await this.ruleRepo.count();
    if (count > 0) return;

    const defaults: CreateRuleDto[] = [
      {
        name: 'Excessive actions per minute',
        metric: 'actionsPerMinute',
        operator: RuleConditionOperator.GT,
        threshold: 120,
        action: RuleAction.ALERT,
        riskPoints: 25,
        priority: 80,
      },
      {
        name: 'Impossible score per session',
        metric: 'scorePerSession',
        operator: RuleConditionOperator.GT,
        threshold: 10000,
        action: RuleAction.REQUIRE_REVIEW,
        riskPoints: 40,
        priority: 90,
      },
      {
        name: 'Rapid device switching',
        metric: 'deviceSwitchesPerHour',
        operator: RuleConditionOperator.GT,
        threshold: 5,
        action: RuleAction.FLAG,
        riskPoints: 20,
        priority: 60,
      },
      {
        name: 'Login from multiple IPs in 1 hour',
        metric: 'uniqueIpsPerHour',
        operator: RuleConditionOperator.GT,
        threshold: 3,
        action: RuleAction.ALERT,
        riskPoints: 15,
        priority: 70,
      },
      {
        name: 'Critical risk score auto-suspend',
        metric: 'riskScore',
        operator: RuleConditionOperator.GTE,
        threshold: 90,
        action: RuleAction.SUSPEND,
        riskPoints: 0,
        priority: 100,
      },
    ];

    for (const d of defaults) {
      await this.createRule(d);
    }

    this.logger.log(`Seeded ${defaults.length} default fraud rules`);
  }

  // ── Rule evaluation ───────────────────────────────────────────────────────

  /**
   * Evaluate all active rules against a player's metric map.
   * Rules are evaluated in priority order (highest first).
   */
  async evaluate(
    playerId: string,
    metrics: Record<string, number>,
  ): Promise<RuleEngineResult> {
    const rules = await this.getActiveRules();
    const firedRules: RuleEvaluationResult[] = [];
    const actions = new Set<RuleAction>();
    let totalRiskPoints = 0;

    for (const rule of rules) {
      const observed = metrics[rule.metric];
      if (observed === undefined) continue;

      const fired = this.evaluateCondition(
        observed,
        rule.operator,
        Number(rule.threshold),
      );

      if (fired) {
        firedRules.push({ rule, fired, observedValue: observed, riskPoints: rule.riskPoints });
        totalRiskPoints += rule.riskPoints;
        actions.add(rule.action);
        this.logger.warn(
          `Rule "${rule.name}" fired for player ${playerId}: ${rule.metric}=${observed} ${rule.operator} ${rule.threshold}`,
        );
      }
    }

    return { playerId, firedRules, totalRiskPoints, actions, evaluatedAt: new Date() };
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private evaluateCondition(
    observed: number,
    operator: RuleConditionOperator,
    threshold: number,
  ): boolean {
    switch (operator) {
      case RuleConditionOperator.GT:  return observed > threshold;
      case RuleConditionOperator.LT:  return observed < threshold;
      case RuleConditionOperator.GTE: return observed >= threshold;
      case RuleConditionOperator.LTE: return observed <= threshold;
      case RuleConditionOperator.EQ:  return observed === threshold;
      case RuleConditionOperator.NEQ: return observed !== threshold;
      default: return false;
    }
  }
}
