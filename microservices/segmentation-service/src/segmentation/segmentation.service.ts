import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnApplicationBootstrap,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'node:crypto';
import { In, Repository } from 'typeorm';

import { CreateSegmentDto } from './dto/create-segment.dto';
import { CreateRuleDto } from './dto/create-rule.dto';
import { UpdateSegmentDto } from './dto/update-segment.dto';
import { AssignExperimentDto } from './dto/create-experiment.dto';
import {
  EvaluateSegmentDto,
  MembershipChangeDto,
  OverlapQueryDto,
} from './dto/evaluate-segment.dto';
import { IngestUserEventDto } from './dto/ingest-user-event.dto';

import { Segment } from './entities/segment.entity';
import { Rule } from './entities/rule.entity';
import { Membership } from './entities/membership.entity';
import { SegmentEvent } from './entities/segment-event.entity';
import {
  AbAssignment,
  AbExperiment,
  ExperimentVariant,
} from './entities/ab-experiment.entity';

import {
  ExperimentStatus,
  MembershipSource,
  RuleCategory,
  RuleCombinator,
  RuleOperator,
  SegmentEventType,
  SegmentStatus,
  SegmentationType,
  UserSignal,
} from './interfaces/user-signal.interface';
import { RedisCacheService } from './redis-cache.service';
import { SegmentationRuleEngineService } from './segmentation-rule-engine.service';

export interface EvaluationSummary {
  segmentId: string;
  added: number;
  removed: number;
  refreshedAt: string;
  durationMs: number;
  matchedUsers: number;
}

export interface OverlapResult {
  totalUsers: number;
  overlappingUsers: number;
  overlapPercentage: number;
  perSegmentSizes: Record<string, number>;
}

@Injectable()
export class SegmentationService
  implements OnModuleInit, OnApplicationBootstrap
{
  private readonly logger = new Logger(SegmentationService.name);

  constructor(
    @InjectRepository(Segment)
    private readonly segmentRepository: Repository<Segment>,
    @InjectRepository(Rule)
    private readonly ruleRepository: Repository<Rule>,
    @InjectRepository(Membership)
    private readonly membershipRepository: Repository<Membership>,
    @InjectRepository(SegmentEvent)
    private readonly eventRepository: Repository<SegmentEvent>,
    @InjectRepository(AbExperiment)
    private readonly experimentRepository: Repository<AbExperiment>,
    @InjectRepository(AbAssignment)
    private readonly assignmentRepository: Repository<AbAssignment>,
    private readonly redisCache: RedisCacheService,
    private readonly ruleEngine: SegmentationRuleEngineService,
    private readonly configService: ConfigService,
  ) {}

  /* --------------------------------------------------------------------- */
  /* Bootstrap                                                             */
  /* --------------------------------------------------------------------- */

  async onModuleInit() {
    await this.seedDefaultSegments();
  }

  async onApplicationBootstrap() {
    await this.recacheAllSizes();
  }

  /* --------------------------------------------------------------------- */
  /* Segments                                                              */
  /* --------------------------------------------------------------------- */

  async listSegments(): Promise<Segment[]> {
    return this.segmentRepository.find({
      relations: { rules: true },
      order: { createdAt: 'DESC' },
    });
  }

  async getSegment(id: string): Promise<Segment> {
    const segment = await this.segmentRepository.findOne({
      where: { id },
      relations: { rules: true },
    });
    if (!segment) {
      throw new NotFoundException(`Segment ${id} not found`);
    }
    return segment;
  }

  async createSegment(dto: CreateSegmentDto): Promise<Segment> {
    const existing = await this.segmentRepository.findOne({
      where: { slug: dto.slug },
    });
    if (existing) {
      throw new ConflictException(`Segment slug ${dto.slug} already exists`);
    }

    const segment = this.segmentRepository.create({
      slug: dto.slug,
      name: dto.name,
      description: dto.description ?? null,
      type: dto.type,
      status: dto.status ?? SegmentStatus.DRAFT,
      evaluationIntervalSeconds: dto.evaluationIntervalSeconds ?? 0,
      cachedSize: 0,
      lastEvaluatedAt: null,
      metadata: dto.metadata ?? {},
    });

    const saved = await this.segmentRepository.save(segment);

    if (dto.rules && dto.rules.length > 0) {
      const rules = dto.rules.map((rule, index) =>
        this.ruleRepository.create({
          ...rule,
          order: rule.order ?? index,
          segmentId: saved.id,
        }),
      );
      await this.ruleRepository.save(rules);
    }

    return this.getSegment(saved.id);
  }

  async updateSegment(id: string, dto: UpdateSegmentDto): Promise<Segment> {
    const segment = await this.getSegment(id);

    if (dto.name !== undefined) segment.name = dto.name;
    if (dto.description !== undefined) segment.description = dto.description;
    if (dto.type !== undefined) segment.type = dto.type;
    if (dto.status !== undefined) segment.status = dto.status;
    if (dto.evaluationIntervalSeconds !== undefined) {
      segment.evaluationIntervalSeconds = dto.evaluationIntervalSeconds;
    }
    if (dto.metadata !== undefined) segment.metadata = dto.metadata;

    await this.segmentRepository.save(segment);
    return this.getSegment(id);
  }

  async deleteSegment(id: string): Promise<void> {
    const segment = await this.getSegment(id);
    await this.segmentRepository.remove(segment);
    await this.redisCache.setSize(id, 0);
  }

  /* --------------------------------------------------------------------- */
  /* Rules                                                                 */
  /* --------------------------------------------------------------------- */

  async addRule(segmentId: string, dto: CreateRuleDto): Promise<Rule> {
    await this.getSegment(segmentId);
    const rule = this.ruleRepository.create({
      ...dto,
      segmentId,
      order: dto.order ?? 0,
    });
    return this.ruleRepository.save(rule);
  }

  async removeRule(segmentId: string, ruleId: string): Promise<void> {
    const rule = await this.ruleRepository.findOne({
      where: { id: ruleId, segmentId },
    });
    if (!rule) {
      throw new NotFoundException(
        `Rule ${ruleId} not found for segment ${segmentId}`,
      );
    }
    await this.ruleRepository.remove(rule);
  }

  /* --------------------------------------------------------------------- */
  /* Membership                                                            */
  /* --------------------------------------------------------------------- */

  async checkMembership(
    segmentId: string,
    userId: string,
  ): Promise<{ matches: boolean; source: 'evaluation' | 'manual' | 'cache' }> {
    const segment = await this.getSegment(segmentId);
    if (segment.status !== SegmentStatus.ACTIVE) {
      throw new BadRequestException(
        `Segment ${segmentId} is not active (status=${segment.status})`,
      );
    }

    const signal = await this.loadSignal(userId);
    const matches = this.ruleEngine.evaluate(segment.rules ?? [], signal);

    if (matches) {
      await this.ensureMembership(segment, userId, MembershipSource.EVALUATION);
    } else {
      await this.removeMembership(segment, userId, MembershipSource.EVALUATION);
    }

    return { matches, source: 'evaluation' };
  }

  async addManualMembers(
    segmentId: string,
    payloads: MembershipChangeDto[],
  ): Promise<{ added: number }> {
    const segment = await this.getSegment(segmentId);
    let added = 0;

    for (const payload of payloads) {
      const wasAdded = await this.ensureMembership(
        segment,
        payload.userId,
        MembershipSource.MANUAL,
        payload.reason,
      );
      if (wasAdded) {
        added += 1;
      }
    }

    await this.refreshSize(segment);
    return { added };
  }

  async removeManualMember(
    segmentId: string,
    userId: string,
    reason?: string,
  ): Promise<{ removed: boolean }> {
    const segment = await this.getSegment(segmentId);
    const removed = await this.removeMembership(
      segment,
      userId,
      MembershipSource.MANUAL,
      reason,
    );
    await this.refreshSize(segment);
    return { removed };
  }

  async listMembers(segmentId: string, limit = 100): Promise<Membership[]> {
    await this.getSegment(segmentId);
    return this.membershipRepository.find({
      where: { segmentId },
      order: { joinedAt: 'DESC' },
      take: limit,
    });
  }

  async getSize(segmentId: string): Promise<{
    segmentId: string;
    size: number;
    measuredAt: string | null;
  }> {
    const cached = await this.redisCache.getSize(segmentId);
    const segment = await this.getSegment(segmentId);

    if (cached !== null) {
      return {
        segmentId,
        size: cached,
        measuredAt: segment.lastEvaluatedAt?.toISOString() ?? null,
      };
    }

    const computed = await this.membershipRepository.count({
      where: { segmentId },
    });
    await this.redisCache.setSize(segmentId, computed);
    segment.cachedSize = computed;
    await this.segmentRepository.save(segment);

    return {
      segmentId,
      size: computed,
      measuredAt: segment.lastEvaluatedAt?.toISOString() ?? null,
    };
  }

  /* --------------------------------------------------------------------- */
  /* Evaluation                                                            */
  /* --------------------------------------------------------------------- */

  async evaluateSegment(
    segmentId: string,
    dto: EvaluateSegmentDto = {},
  ): Promise<EvaluationSummary> {
    const segment = await this.getSegment(segmentId);
    if (segment.status === SegmentStatus.ARCHIVED) {
      throw new BadRequestException('Cannot evaluate an archived segment');
    }

    const startedAt = Date.now();
    const candidateUserIds = await this.collectCandidateUserIds(dto);

    let added = 0;
    let removed = 0;
    const matchedUsers: string[] = [];

    for (const userId of candidateUserIds) {
      const signal = await this.loadSignal(userId);
      const matches = this.ruleEngine.evaluate(segment.rules ?? [], signal);

      if (matches) {
        const isNew = await this.ensureMembership(
          segment,
          userId,
          MembershipSource.EVALUATION,
        );
        if (isNew) {
          added += 1;
        } else {
          await this.recordEvent(
            segment,
            userId,
            SegmentEventType.REFRESHED,
            'evaluation sweep',
          );
        }
        matchedUsers.push(userId);
      } else {
        const removedRow = await this.removeMembership(
          segment,
          userId,
          MembershipSource.EVALUATION,
        );
        if (removedRow) {
          removed += 1;
        }
      }
    }

    segment.lastEvaluatedAt = new Date();
    segment.cachedSize = await this.membershipRepository.count({
      where: { segmentId: segment.id },
    });
    await this.segmentRepository.save(segment);
    await this.redisCache.setSize(segment.id, segment.cachedSize);

    return {
      segmentId: segment.id,
      added,
      removed,
      matchedUsers: matchedUsers.length,
      refreshedAt: segment.lastEvaluatedAt.toISOString(),
      durationMs: Date.now() - startedAt,
    };
  }

  async evaluateAllDueSegments(): Promise<EvaluationSummary[]> {
    const segments = await this.segmentRepository.find({
      where: { status: SegmentStatus.ACTIVE },
      relations: { rules: true },
    });

    const due = segments.filter((segment) => {
      if (!segment.evaluationIntervalSeconds) {
        return false;
      }
      if (!segment.lastEvaluatedAt) {
        return true;
      }
      const ageSeconds =
        (Date.now() - segment.lastEvaluatedAt.getTime()) / 1000;
      return ageSeconds >= segment.evaluationIntervalSeconds;
    });

    const summaries: EvaluationSummary[] = [];
    for (const segment of due) {
      try {
        summaries.push(await this.evaluateSegment(segment.id, {}));
      } catch (error) {
        this.logger.warn(
          `Failed to evaluate segment ${segment.id}: ${
            (error as Error).message
          }`,
        );
      }
    }
    return summaries;
  }

  /* --------------------------------------------------------------------- */
  /* Signal ingest (real-time)                                              */
  /* --------------------------------------------------------------------- */

  async ingestSignal(payload: IngestUserEventDto): Promise<{
    userId: string;
    matchedSegmentIds: string[];
    evaluated: string[];
  }> {
    if (!payload.userId) {
      throw new BadRequestException('userId is required');
    }

    const signal = await this.upsertSignal(payload);
    const explicit = payload.segmentsToReEvaluate ?? [];
    const segments =
      explicit.length > 0
        ? await this.segmentRepository.find({
            where: { id: In(explicit) },
            relations: { rules: true },
          })
        : await this.segmentRepository.find({
            where: { status: SegmentStatus.ACTIVE },
            relations: { rules: true },
          });

    const matched: string[] = [];
    for (const segment of segments) {
      const matchedNow = this.ruleEngine.evaluate(segment.rules ?? [], signal);

      if (matchedNow) {
        await this.ensureMembership(
          segment,
          payload.userId,
          MembershipSource.REALTIME,
        );
        matched.push(segment.id);
      } else if (!explicit.includes(segment.id)) {
        // Only auto-remove when the signal wasn't explicitly scoped to this segment.
        await this.removeMembership(
          segment,
          payload.userId,
          MembershipSource.REALTIME,
        );
      }
    }

    return {
      userId: payload.userId,
      matchedSegmentIds: matched,
      evaluated: segments.map((seg) => seg.id),
    };
  }

  /* --------------------------------------------------------------------- */
  /* Overlap analysis                                                       */
  /* --------------------------------------------------------------------- */

  async overlap(query: OverlapQueryDto): Promise<OverlapResult> {
    if (query.segmentIds.length < 2) {
      throw new BadRequestException(
        'Overlap query requires at least two segment ids',
      );
    }

    const perSegmentSizes: Record<string, number> = {};
    const pivotUsers: Set<string> = new Set();
    let pivotInitialized = false;

    for (const segmentId of query.segmentIds) {
      const members = await this.membershipRepository.find({
        where: { segmentId },
        select: { userId: true },
        take: 50000,
      });

      perSegmentSizes[segmentId] = members.length;

      if (!pivotInitialized) {
        // Seed the intersection with the first segment that actually has
        // members. If the first segment is empty the intersection is empty.
        if (members.length === 0) {
          pivotInitialized = true;
          continue;
        }
        for (const member of members) {
          pivotUsers.add(member.userId);
        }
        pivotInitialized = true;
        continue;
      }

      if (pivotUsers.size > 0) {
        const userIds = new Set(members.map((member) => member.userId));
        for (const id of Array.from(pivotUsers)) {
          if (!userIds.has(id)) {
            pivotUsers.delete(id);
          }
        }
      }
    }

    const overlappingUsers = pivotUsers.size;
    const totalUsers = Object.values(perSegmentSizes).reduce(
      (sum, current) => sum + current,
      0,
    );

    const overlapPercentage =
      totalUsers > 0 ? overlappingUsers / totalUsers : 0;

    return {
      totalUsers,
      overlappingUsers,
      overlapPercentage: Math.round(overlapPercentage * 10000) / 10000,
      perSegmentSizes,
    };
  }

  /* --------------------------------------------------------------------- */
  /* A/B experiments                                                        */
  /* --------------------------------------------------------------------- */

  /** Create a new A/B experiment bound to (optionally) a segment. */
  async createExperiment(payload: {
    key: string;
    name: string;
    description?: string;
    segmentId?: string;
    status?: ExperimentStatus;
    variants: ExperimentVariant[];
    metadata?: Record<string, unknown>;
  }): Promise<AbExperiment> {
    const existing = await this.experimentRepository.findOne({
      where: { key: payload.key },
    });
    if (existing) {
      throw new ConflictException(
        `Experiment with key ${payload.key} already exists`,
      );
    }

    if (payload.segmentId) {
      const segment = await this.segmentRepository.findOne({
        where: { id: payload.segmentId },
      });
      if (!segment) {
        throw new BadRequestException(`Segment ${payload.segmentId} not found`);
      }
    }

    const weights = payload.variants.reduce(
      (sum, variant) => sum + (variant.weight ?? 0),
      0,
    );
    if (weights <= 0) {
      throw new BadRequestException(
        'Experiment variants must have positive weights',
      );
    }

    const normalised = payload.variants.map((variant) => ({
      ...variant,
      weight: variant.weight / weights,
    }));

    const experiment = this.experimentRepository.create({
      key: payload.key,
      name: payload.name,
      description: payload.description ?? null,
      segmentId: payload.segmentId ?? null,
      status: payload.status ?? ExperimentStatus.DRAFT,
      variants: normalised,
      metadata: payload.metadata ?? {},
      assignmentCount: 0,
    });

    return this.experimentRepository.save(experiment);
  }

  async assignVariant(
    experimentId: string,
    dto: AssignExperimentDto,
  ): Promise<{
    experimentId: string;
    userId: string;
    variantKey: string;
    persisted: boolean;
  }> {
    const experiment = await this.experimentRepository.findOne({
      where: { id: experimentId },
    });
    if (!experiment) {
      throw new NotFoundException(`Experiment ${experimentId} not found`);
    }

    if (experiment.status !== ExperimentStatus.RUNNING) {
      throw new BadRequestException(
        `Experiment ${experiment.key} is not running`,
      );
    }

    const cached = await this.redisCache.getAssignment(
      experiment.key,
      dto.userId,
    );

    if (cached) {
      return {
        experimentId,
        userId: dto.userId,
        variantKey: cached,
        persisted: false,
      };
    }

    const trafficSplit = dto.trafficSplit ?? 1;
    const bucket = this.bucketize(experiment.key, dto.userId);

    if (bucket >= trafficSplit) {
      return {
        experimentId,
        userId: dto.userId,
        variantKey: 'control',
        persisted: false,
      };
    }

    const variantKey = this.pickVariant(experiment, dto.userId);
    await this.persistAssignment(experiment, dto.userId, variantKey);
    return {
      experimentId,
      userId: dto.userId,
      variantKey,
      persisted: true,
    };
  }

  /* --------------------------------------------------------------------- */
  /* Dashboard                                                              */
  /* --------------------------------------------------------------------- */

  async getDashboard() {
    const segments = await this.segmentRepository.find();
    const [active, drafts, paused, archived] = [
      segments.filter((seg) => seg.status === SegmentStatus.ACTIVE).length,
      segments.filter((seg) => seg.status === SegmentStatus.DRAFT).length,
      segments.filter((seg) => seg.status === SegmentStatus.PAUSED).length,
      segments.filter((seg) => seg.status === SegmentStatus.ARCHIVED).length,
    ];
    const totalSize = segments.reduce(
      (sum, segment) => sum + (segment.cachedSize ?? 0),
      0,
    );
    const experiments = await this.experimentRepository.count();
    const recentEvents = await this.eventRepository.find({
      order: { createdAt: 'DESC' },
      take: 10,
    });

    return {
      segments: {
        total: segments.length,
        active,
        drafts,
        paused,
        archived,
        totalMembers: totalSize,
      },
      experiments: {
        total: experiments,
      },
      recentEvents,
      generatedAt: new Date().toISOString(),
    };
  }

  /* --------------------------------------------------------------------- */
  /* Internals                                                              */
  /* --------------------------------------------------------------------- */

  private async loadSignal(userId: string): Promise<UserSignal | null> {
    return this.redisCache.getSignal(userId);
  }

  private async upsertSignal(payload: IngestUserEventDto): Promise<UserSignal> {
    const existing = (await this.redisCache.getSignal(payload.userId)) ?? {
      userId: payload.userId,
      attributes: {},
    };

    const next: UserSignal = {
      ...existing,
      attributes: {
        ...(existing.attributes ?? {}),
        ...(payload.attributes ?? {}),
      },
    };

    if (payload.action) {
      next.lastAction = payload.action;
      next.eventCount = (existing.eventCount ?? 0) + (payload.increment ?? 1);
      next.lastEventAt = new Date().toISOString();
    }

    const topLevelKeys = [
      'country',
      'locale',
      'age',
      'gender',
      'platform',
      'level',
      'xp',
      'totalSpend',
      'streak',
      'consecutiveDays',
    ] as const;

    for (const key of topLevelKeys) {
      const candidate = (payload.attributes ?? {})[key];
      if (candidate !== undefined) {
        (next as unknown as Record<string, unknown>)[key] = candidate;
      }
    }

    await this.redisCache.setSignal(next);
    return next;
  }

  private async collectCandidateUserIds(
    dto: EvaluateSegmentDto,
  ): Promise<string[]> {
    if (dto.userIds && dto.userIds.length > 0) {
      return Array.from(new Set(dto.userIds));
    }

    if (dto.userId) {
      return [dto.userId];
    }

    const memberships = await this.membershipRepository.find({
      select: { userId: true },
      take: dto.limit ?? 500,
    });
    return memberships.map((membership) => membership.userId);
  }

  private async ensureMembership(
    segment: Segment,
    userId: string,
    source: MembershipSource,
    reason?: string,
  ): Promise<boolean> {
    const existing = await this.membershipRepository.findOne({
      where: { segmentId: segment.id, userId },
    });

    if (existing) {
      // Refresh source if it's a stronger signal (manual > realtime > evaluation)
      if (
        source === MembershipSource.MANUAL &&
        existing.source !== MembershipSource.MANUAL
      ) {
        existing.source = MembershipSource.MANUAL;
        await this.membershipRepository.save(existing);
      }
      return false;
    }

    const membership = this.membershipRepository.create({
      segmentId: segment.id,
      userId,
      source,
      metadata: reason ? { reason } : {},
    });
    await this.membershipRepository.save(membership);
    await this.recordEvent(segment, userId, SegmentEventType.ADDED, source, {
      reason,
    });
    return true;
  }

  private async removeMembership(
    segment: Segment,
    userId: string,
    source: MembershipSource,
    reason?: string,
  ): Promise<boolean> {
    const existing = await this.membershipRepository.findOne({
      where: { segmentId: segment.id, userId },
    });

    if (!existing) {
      return false;
    }

    // Never auto-remove manual memberships via evaluation/realtime sweeps.
    if (
      existing.source === MembershipSource.MANUAL &&
      source !== MembershipSource.MANUAL
    ) {
      return false;
    }

    await this.membershipRepository.remove(existing);
    await this.recordEvent(
      segment,
      userId,
      SegmentEventType.REMOVED,
      `${source}${reason ? `:${reason}` : ''}`,
    );
    return true;
  }

  private async recordEvent(
    segment: Segment,
    userId: string,
    type: SegmentEventType,
    reason: string | null,
    metadata: Record<string, unknown> = {},
  ): Promise<void> {
    const event = this.eventRepository.create({
      segmentId: segment.id,
      userId,
      type,
      reason,
      metadata,
    });
    await this.eventRepository.save(event);
  }

  private async refreshSize(segment: Segment): Promise<void> {
    const size = await this.membershipRepository.count({
      where: { segmentId: segment.id },
    });
    segment.cachedSize = size;
    segment.lastEvaluatedAt = new Date();
    await this.segmentRepository.save(segment);
    await this.redisCache.setSize(segment.id, size);
  }

  private async recacheAllSizes(): Promise<void> {
    const segments = await this.segmentRepository.find();
    for (const segment of segments) {
      const size = await this.membershipRepository.count({
        where: { segmentId: segment.id },
      });
      await this.redisCache.setSize(segment.id, size);
    }
  }

  private bucketize(experimentKey: string, userId: string): number {
    const salt =
      this.configService.get<string>(
        'SEGMENT_AB_TEST_VARIANT_SALT',
        'quest-segmentation-ab-v1',
      ) || 'quest-segmentation-ab-v1';
    const hash = createHash('md5')
      .update(`${experimentKey}:${salt}:${userId}`)
      .digest('hex');
    const slice = parseInt(hash.substring(0, 8), 16);
    return (slice % 10000) / 10000;
  }

  private pickVariant(experiment: AbExperiment, userId: string): string {
    const variants = experiment.variants ?? [];
    if (variants.length === 0) {
      return 'control';
    }

    const salt =
      this.configService.get<string>(
        'SEGMENT_AB_TEST_VARIANT_SALT',
        'quest-segmentation-ab-v1',
      ) || 'quest-segmentation-ab-v1';

    // The experiment key MUST be in the hash so the same user gets different
    // variants across experiments - a missing key would cause collisions
    // whenever two experiments share variant keys.
    const hash = createHash('md5')
      .update(`variant:${salt}:${experiment.key}:${userId}`)
      .digest('hex');
    const slice = parseInt(hash.substring(0, 8), 16);
    const bucket = (slice % 10000) / 10000;

    let cumulative = 0;
    for (const variant of variants) {
      cumulative += variant.weight;
      if (bucket < cumulative) {
        return variant.key;
      }
    }
    return variants[variants.length - 1].key;
  }

  private async persistAssignment(
    experiment: AbExperiment,
    userId: string,
    variantKey: string,
  ): Promise<void> {
    const result = await this.assignmentRepository
      .createQueryBuilder()
      .insert()
      .into(AbAssignment)
      .values({ experimentId: experiment.id, userId, variantKey })
      .orIgnore()
      .execute();

    // Only increment on a fresh insert (race-loser hits identifiers: []).
    const inserted = Array.isArray(result?.identifiers)
      ? result.identifiers.length > 0
      : true;

    if (inserted) {
      await this.experimentRepository.increment(
        { id: experiment.id },
        'assignmentCount',
        1,
      );
    }

    await this.redisCache.setAssignment(experiment.key, userId, variantKey);
  }

  private async seedDefaultSegments(): Promise<void> {
    const shouldSeed =
      this.configService.get<string>('SEGMENTATION_SEED_DEFAULTS', 'true') !==
      'false';
    if (!shouldSeed) {
      return;
    }

    const existing = await this.segmentRepository.count();
    if (existing > 0) {
      return;
    }

    const defaults: Array<{
      slug: string;
      name: string;
      description: string;
      type: SegmentationType;
      rules: Array<CreateRuleDto>;
    }> = [
      {
        slug: 'high-value-players',
        name: 'High-Value Players',
        description:
          'Active players who spent more than $50 and reached at least level 10.',
        type: SegmentationType.BEHAVIORAL,
        rules: [
          {
            field: 'level',
            operator: RuleOperator.GTE,
            value: 10,
            category: RuleCategory.BEHAVIORAL,
            combinator: RuleCombinator.AND,
            order: 0,
          },
          {
            field: 'totalSpend',
            operator: RuleOperator.GTE,
            value: 50,
            category: RuleCategory.BEHAVIORAL,
            combinator: RuleCombinator.AND,
            order: 1,
          },
        ],
      },
      {
        slug: 'us-mobile-users',
        name: 'US Mobile Users',
        description: 'Players located in the United States on iOS or Android.',
        type: SegmentationType.DEMOGRAPHIC,
        rules: [
          {
            field: 'country',
            operator: RuleOperator.EQUALS,
            value: 'US',
            category: RuleCategory.DEMOGRAPHIC,
            combinator: RuleCombinator.AND,
            order: 0,
          },
          {
            field: 'platform',
            operator: RuleOperator.IN,
            value: ['ios', 'android'],
            category: RuleCategory.DEMOGRAPHIC,
            combinator: RuleCombinator.AND,
            order: 1,
          },
        ],
      },
      {
        slug: 'at-risk-churners',
        name: 'At-Risk Churners',
        description:
          'Users with a long streak who have not logged an event in 14+ days.',
        type: SegmentationType.BEHAVIORAL,
        rules: [
          {
            field: 'streak',
            operator: RuleOperator.GTE,
            value: 7,
            category: RuleCategory.BEHAVIORAL,
            combinator: RuleCombinator.AND,
            order: 0,
          },
          {
            field: 'lastEventAt',
            operator: RuleOperator.NOT_EXISTS,
            value: null,
            category: RuleCategory.BEHAVIORAL,
            combinator: RuleCombinator.AND,
            order: 1,
          },
        ],
      },
    ];

    for (const definition of defaults) {
      await this.createSegment({
        slug: definition.slug,
        name: definition.name,
        description: definition.description,
        type: definition.type,
        status: SegmentStatus.ACTIVE,
        rules: definition.rules,
      });
    }
    this.logger.log(`Seeded ${defaults.length} default segments`);
  }
}
