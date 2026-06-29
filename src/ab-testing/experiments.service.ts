import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';

import { Experiment, ExperimentStatus } from './entities/experiment.entity';
import { ExperimentConversion } from './entities/experiment-conversion.entity';
import { FeatureFlag, TargetCohort } from './entities/feature-flag.entity';
import { ExperimentAssignment } from './entities/experiment-assignment.entity';
import { CreateExperimentDto } from './dto/create-experiment.dto';
import { TrackConversionDto } from './dto/track-conversion.dto';
import { UpdateFlagDto } from './dto/update-flag.dto';
import { CreateFlagDto } from './dto/create-flag.dto';

export interface PlayerContext {
  userId: string;
  isPremium: boolean;
  accountAgeDays: number;
}

@Injectable()
export class ExperimentsService {
  constructor(
    @InjectRepository(Experiment)
    private readonly experimentRepo: Repository<Experiment>,

    @InjectRepository(ExperimentConversion)
    private readonly conversionRepo: Repository<ExperimentConversion>,

    @InjectRepository(FeatureFlag)
    private readonly flagRepo: Repository<FeatureFlag>,

    @InjectRepository(ExperimentAssignment)
    private readonly assignmentRepo: Repository<ExperimentAssignment>,
  ) {}

  // ─── Experiments ──────────────────────────────────────────────────────────

  async createExperiment(dto: CreateExperimentDto): Promise<Experiment> {
    const experiment = this.experimentRepo.create({
      ...dto,
      status: ExperimentStatus.DRAFT,
    });
    return this.experimentRepo.save(experiment);
  }

  /**
   * Deterministically assigns a player to a variant using MD5 hash.
   * The same userId always produces the same variant for a given experiment.
   * Returns null when the player falls outside the traffic split.
   */
  async assignVariant(userId: string): Promise<{
    experimentId: string;
    variantName: string;
  } | null> {
    const running = await this.experimentRepo.find({
      where: { status: ExperimentStatus.RUNNING },
    });

    if (!running.length) return null;

    // Use first running experiment — extend to return all if needed
    const experiment = running[0];
    const variantName = this.resolveVariant(userId, experiment);

    if (!variantName) return null;

    // Store assignment for future reference
    await this.storeAssignment(experiment.id, userId, variantName);

    return { experimentId: experiment.id, variantName };
  }

  async trackConversion(
    experimentId: string,
    dto: TrackConversionDto,
  ): Promise<ExperimentConversion> {
    const experiment = await this.experimentRepo.findOne({
      where: { id: experimentId },
    });
    if (!experiment) {
      throw new NotFoundException(`Experiment ${experimentId} not found`);
    }

    const variantName = this.resolveVariant(dto.user_id, experiment);
    if (!variantName) {
      throw new NotFoundException(
        `User ${dto.user_id} is not assigned to experiment ${experimentId}`,
      );
    }

    const conversion = this.conversionRepo.create({
      experiment_id: experimentId,
      user_id: dto.user_id,
      variant_name: variantName,
      event_type: dto.event_type,
    });

    // Update assignment with conversion timestamp
    await this.assignmentRepo.update(
      { experiment_id: experimentId, user_id: dto.user_id },
      { last_converted_at: new Date() },
    );

    return this.conversionRepo.save(conversion);
  }

  async getResults(experimentId: string) {
    const experiment = await this.experimentRepo.findOne({
      where: { id: experimentId },
    });
    if (!experiment) {
      throw new NotFoundException(`Experiment ${experimentId} not found`);
    }

    const conversions = await this.conversionRepo.find({
      where: { experiment_id: experimentId },
    });

    // Aggregate per variant
    const stats: Record<
      string,
      { uniqueUsers: Set<string>; conversions: number }
    > = {};

    for (const v of experiment.variants) {
      stats[v.name] = { uniqueUsers: new Set(), conversions: 0 };
    }

    for (const c of conversions) {
      if (stats[c.variant_name]) {
        stats[c.variant_name].uniqueUsers.add(c.user_id);
        stats[c.variant_name].conversions++;
      }
    }

    const results = Object.entries(stats).map(([name, s]) => ({
      variant: name,
      total_users: s.uniqueUsers.size,
      conversions: s.conversions,
      conversion_rate:
        s.uniqueUsers.size > 0 ? s.conversions / s.uniqueUsers.size : 0,
    }));

    const significance =
      results.length >= 2
        ? this.zScore(results[0], results[1])
        : null;

    return {
      experiment_id: experimentId,
      results,
      significance,
    };
  }

  // ─── Feature Flags ────────────────────────────────────────────────────────

  async createFlag(dto: CreateFlagDto): Promise<FeatureFlag> {
    const flag = this.flagRepo.create({
      key: dto.key,
      enabled: dto.enabled ?? false,
      rollout_pct: dto.rollout_pct ?? 100,
      target_cohort: dto.target_cohort ?? TargetCohort.ALL,
    });
    return this.flagRepo.save(flag);
  }

  async evaluateFlag(key: string, player: PlayerContext): Promise<boolean> {
    const flag = await this.flagRepo.findOne({ where: { key } });
    if (!flag || !flag.enabled) return false;

    if (!this.isInCohort(flag.target_cohort, player)) return false;

    if (flag.rollout_pct >= 100) return true;
    if (flag.rollout_pct <= 0) return false;

    // Deterministic bucket: same user always gets same result
    const hash = crypto
      .createHash('md5')
      .update(`${player.userId}:${key}`)
      .digest('hex');

    const bucket = parseInt(hash.substring(0, 8), 16) % 100;
    return bucket < flag.rollout_pct;
  }

  async updateFlag(key: string, dto: UpdateFlagDto): Promise<FeatureFlag> {
    const flag = await this.flagRepo.findOne({ where: { key } });
    if (!flag) throw new NotFoundException(`Flag "${key}" not found`);
    Object.assign(flag, dto);
    return this.flagRepo.save(flag);
  }

  async listFlags(): Promise<FeatureFlag[]> {
    return this.flagRepo.find();
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  /**
   * Core assignment logic — extracted so both assignVariant and
   * trackConversion use exactly the same deterministic function.
   */
  private resolveVariant(
    userId: string,
    experiment: Experiment,
  ): string | null {
    const hash = crypto
      .createHash('md5')
      .update(`${userId}:${experiment.id}`)
      .digest('hex');

    const bucket = parseInt(hash.substring(0, 8), 16) % 100;

    if (bucket >= experiment.traffic_split_pct) return null;

    const index = bucket % experiment.variants.length;
    return experiment.variants[index].name;
  }

  private async storeAssignment(
    experimentId: string,
    userId: string,
    variantName: string,
  ): Promise<void> {
    // Upsert assignment
    const existing = await this.assignmentRepo.findOne({
      where: { experiment_id: experimentId, user_id: userId },
    });

    if (existing) {
      await this.assignmentRepo.update(
        { id: existing.id },
        { variant_name: variantName, assigned_at: new Date() },
      );
    } else {
      const assignment = this.assignmentRepo.create({
        experiment_id: experimentId,
        user_id: userId,
        variant_name: variantName,
        assigned_at: new Date(),
      });
      await this.assignmentRepo.save(assignment);
    }
  }

  private isInCohort(cohort: TargetCohort, player: PlayerContext): boolean {
    switch (cohort) {
      case TargetCohort.ALL:
        return true;
      case TargetCohort.PREMIUM:
        return player.isPremium;
      case TargetCohort.NEW_USERS:
        return player.accountAgeDays <= 7;
      default:
        return false;
    }
  }

  /**
   * Two-proportion z-score for statistical significance.
   * |z| >= 1.96 means 95% confidence the difference is not by chance.
   */
  private zScore(
    a: { total_users: number; conversions: number; conversion_rate: number },
    b: { total_users: number; conversions: number; conversion_rate: number },
  ): { z_score: number; significant: boolean } {
    if (a.total_users === 0 || b.total_users === 0) {
      return { z_score: 0, significant: false };
    }

    const pooled =
      (a.conversions + b.conversions) / (a.total_users + b.total_users);

    const se = Math.sqrt(
      pooled * (1 - pooled) * (1 / a.total_users + 1 / b.total_users),
    );

    if (se === 0) return { z_score: 0, significant: false };

    const z = (a.conversion_rate - b.conversion_rate) / se;
    return {
      z_score: parseFloat(z.toFixed(4)),
      significant: Math.abs(z) >= 1.96,
    };
  }
}