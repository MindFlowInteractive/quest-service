import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  CommunityEvent,
  CommunityEventStatus,
  CommunityEventPhase,
} from './entities/community-event.entity';
import { EventParticipation } from './entities/event-participation.entity';
import { EventMilestone } from './entities/event-milestone.entity';
import { CreateCommunityEventDto } from './dto/create-community-event.dto';
import { RecordParticipationDto, CreateMilestoneDto } from './dto/participation.dto';

export interface EventLeaderboardEntry {
  rank: number;
  userId: string;
  score: number;
  actionsPerformed: number;
  milestonesReached: number;
  lastActivityAt: Date | undefined;
}

export interface EventAnalytics {
  eventId: string;
  participantCount: number;
  totalActionsPerformed: number;
  averageScore: number;
  milestoneCompletionRates: Array<{
    milestoneId: string;
    milestoneName: string;
    requiredScore: number;
    participantsReached: number;
    completionRate: number;
  }>;
  topParticipants: Array<{ userId: string; score: number }>;
  dailyEngagement: Record<string, number>;
}

@Injectable()
export class CommunityEventsService {
  private readonly logger = new Logger(CommunityEventsService.name);

  constructor(
    @InjectRepository(CommunityEvent)
    private readonly eventRepository: Repository<CommunityEvent>,
    @InjectRepository(EventParticipation)
    private readonly participationRepository: Repository<EventParticipation>,
    @InjectRepository(EventMilestone)
    private readonly milestoneRepository: Repository<EventMilestone>,
  ) {}

  // ─── Event Scheduling ──────────────────────────────────────────────────────

  /**
   * Cron: activate/deactivate events every 5 minutes and advance phases.
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleEventScheduling(): Promise<void> {
    this.logger.log('Running community event scheduling cron job');
    const now = new Date();

    try {
      await this.activateScheduledEvents(now);
      await this.deactivateExpiredEvents(now);
      await this.advanceEventPhases(now);
    } catch (error) {
      this.logger.error('Error in event scheduling cron', (error as Error).stack);
    }
  }

  private async activateScheduledEvents(now: Date): Promise<void> {
    const events = await this.eventRepository.find({
      where: {
        status: CommunityEventStatus.SCHEDULED,
        isPublished: true,
        startDate: LessThanOrEqual(now),
        endDate: MoreThan(now),
      },
    });

    for (const event of events) {
      event.status = CommunityEventStatus.ACTIVE;
      event.currentPhase = CommunityEventPhase.MAIN;
      await this.eventRepository.save(event);
      this.logger.log(`Activated community event: ${event.name} (${event.id})`);
    }
  }

  private async deactivateExpiredEvents(now: Date): Promise<void> {
    const events = await this.eventRepository.find({
      where: {
        status: CommunityEventStatus.ACTIVE,
        endDate: LessThan(now),
      },
    });

    for (const event of events) {
      event.status = CommunityEventStatus.COMPLETED;
      event.currentPhase = CommunityEventPhase.ENDED;
      await this.eventRepository.save(event);
      this.logger.log(`Completed community event: ${event.name} (${event.id})`);
      await this.distributeEndRewards(event.id);
    }
  }

  private async advanceEventPhases(now: Date): Promise<void> {
    const activeEvents = await this.eventRepository.find({
      where: { status: CommunityEventStatus.ACTIVE },
    });

    for (const event of activeEvents) {
      if (!event.phases?.length) continue;

      const currentPhaseConfig = event.phases.find(
        (p) =>
          new Date(p.startDate) <= now && new Date(p.endDate) >= now,
      );

      if (
        currentPhaseConfig &&
        currentPhaseConfig.phase !== event.currentPhase
      ) {
        event.currentPhase = currentPhaseConfig.phase;
        await this.eventRepository.save(event);
        this.logger.log(
          `Advanced event ${event.id} to phase: ${currentPhaseConfig.phase}`,
        );
      }
    }
  }

  // ─── CRUD ──────────────────────────────────────────────────────────────────

  async create(dto: CreateCommunityEventDto): Promise<CommunityEvent> {
    if (dto.startDate >= dto.endDate) {
      throw new BadRequestException('startDate must be before endDate');
    }

    const event = this.eventRepository.create({
      ...dto,
      status: CommunityEventStatus.SCHEDULED,
      currentPhase: CommunityEventPhase.PRE_EVENT,
    });

    return this.eventRepository.save(event);
  }

  async findAll(filters: { status?: CommunityEventStatus } = {}): Promise<CommunityEvent[]> {
    return this.eventRepository.find({ where: filters });
  }

  async findOne(id: string): Promise<CommunityEvent> {
    const event = await this.eventRepository.findOne({
      where: { id },
      relations: ['milestones'],
    });
    if (!event) {
      throw new NotFoundException(`Community event ${id} not found`);
    }
    return event;
  }

  async findActive(): Promise<CommunityEvent[]> {
    return this.eventRepository.find({
      where: { status: CommunityEventStatus.ACTIVE, isPublished: true },
    });
  }

  // ─── Participation ─────────────────────────────────────────────────────────

  /**
   * Record a participation action for a user.
   * Creates participant record on first join, updates score afterwards.
   * Checks milestones and grants rewards.
   */
  async recordParticipation(
    eventId: string,
    dto: RecordParticipationDto,
  ): Promise<EventParticipation> {
    const event = await this.findOne(eventId);

    if (event.status !== CommunityEventStatus.ACTIVE) {
      throw new BadRequestException('Community event is not currently active');
    }

    if (
      event.maxParticipants !== null &&
      event.maxParticipants !== undefined
    ) {
      const count = await this.participationRepository.count({
        where: { eventId },
      });
      if (count >= event.maxParticipants) {
        throw new BadRequestException('Event has reached its maximum number of participants');
      }
    }

    let participation = await this.participationRepository.findOne({
      where: { userId: dto.userId, eventId },
    });

    const isFirstJoin = !participation;

    if (!participation) {
      participation = this.participationRepository.create({
        userId: dto.userId,
        eventId,
        joinedAt: new Date(),
        lastActivityAt: new Date(),
        isVerified: false,
      });

      // Increment event participant counter
      await this.eventRepository.increment({ id: eventId }, 'participantCount', 1);
    }

    participation.score += dto.score;
    participation.actionsPerformed += 1;
    participation.lastActivityAt = new Date();

    if (dto.actionMetadata) {
      participation.verificationData = {
        ...(participation.verificationData ?? {}),
        ...dto.actionMetadata,
      };
    }

    participation = await this.participationRepository.save(participation);

    // Update daily analytics
    await this.updateAnalytics(eventId, dto.userId, isFirstJoin);

    // Check and award milestones
    await this.checkMilestones(participation, eventId);

    // Mark as verified once the user has taken at least one action
    if (!participation.isVerified) {
      participation.isVerified = true;
      participation = await this.participationRepository.save(participation);
    }

    return participation;
  }

  private async checkMilestones(
    participation: EventParticipation,
    eventId: string,
  ): Promise<void> {
    const milestones = await this.milestoneRepository.find({
      where: { eventId, isActive: true },
      order: { requiredScore: 'ASC' },
    });

    for (const milestone of milestones) {
      // Skip if already reached
      const alreadyReached = participation.milestonesReached.some(
        (m) => m.milestoneId === milestone.id,
      );
      if (alreadyReached) continue;

      // Skip if score threshold not yet met
      if (participation.score < milestone.requiredScore) continue;

      // Skip if reward cap exhausted
      if (
        milestone.maxClaims !== null &&
        milestone.maxClaims !== undefined &&
        milestone.claimedCount >= milestone.maxClaims
      ) {
        continue;
      }

      // Award milestone
      participation.milestonesReached.push({
        milestoneId: milestone.id,
        milestoneName: milestone.name,
        reachedAt: new Date(),
      });

      participation.rewardsEarned.push({
        rewardId: milestone.id,
        rewardName: milestone.reward.name,
        rewardType: milestone.reward.type,
        earnedAt: new Date(),
      });

      await this.milestoneRepository.increment({ id: milestone.id }, 'claimedCount', 1);
      this.logger.log(
        `Milestone "${milestone.name}" reached by user ${participation.userId}`,
      );
    }

    await this.participationRepository.save(participation);
  }

  private async updateAnalytics(
    eventId: string,
    _userId: string,
    isFirstJoin: boolean,
  ): Promise<void> {
    const event = await this.eventRepository.findOne({ where: { id: eventId } });
    if (!event) return;

    const today = new Date().toISOString().split('T')[0];
    const dailyParticipants = event.analytics.dailyParticipants ?? {};
    dailyParticipants[today] = (dailyParticipants[today] ?? 0) + (isFirstJoin ? 1 : 0);

    const totalActions = (event.analytics.totalActionsPerformed ?? 0) + 1;

    event.analytics = {
      ...event.analytics,
      totalActionsPerformed: totalActions,
      dailyParticipants,
    };

    await this.eventRepository.save(event);
  }

  // ─── Milestones ────────────────────────────────────────────────────────────

  async addMilestone(
    eventId: string,
    dto: CreateMilestoneDto,
  ): Promise<EventMilestone> {
    await this.findOne(eventId); // Validate event exists

    const milestone = this.milestoneRepository.create({
      ...dto,
      eventId,
      displayOrder: dto.displayOrder ?? 0,
    });

    return this.milestoneRepository.save(milestone);
  }

  async getMilestones(eventId: string): Promise<EventMilestone[]> {
    await this.findOne(eventId);
    return this.milestoneRepository.find({
      where: { eventId },
      order: { displayOrder: 'ASC', requiredScore: 'ASC' },
    });
  }

  // ─── Leaderboard ───────────────────────────────────────────────────────────

  async getLeaderboard(
    eventId: string,
    limit: number = 10,
  ): Promise<EventLeaderboardEntry[]> {
    await this.findOne(eventId);

    const participations = await this.participationRepository.find({
      where: { eventId },
      order: { score: 'DESC', actionsPerformed: 'DESC', lastActivityAt: 'ASC' },
      take: limit,
    });

    return participations.map((p, index) => ({
      rank: index + 1,
      userId: p.userId,
      score: p.score,
      actionsPerformed: p.actionsPerformed,
      milestonesReached: p.milestonesReached.length,
      lastActivityAt: p.lastActivityAt,
    }));
  }

  async getUserRank(
    eventId: string,
    userId: string,
  ): Promise<{ rank: number | null; participation: EventParticipation | null }> {
    await this.findOne(eventId);

    const participation = await this.participationRepository.findOne({
      where: { userId, eventId },
    });

    if (!participation) {
      return { rank: null, participation: null };
    }

    const higher = await this.participationRepository.count({
      where: [
        { eventId, score: MoreThan(participation.score) },
      ],
    });

    return { rank: higher + 1, participation };
  }

  // ─── Reward Distribution ───────────────────────────────────────────────────

  async distributeEndRewards(eventId: string): Promise<void> {
    const event = await this.eventRepository.findOne({ where: { id: eventId } });
    if (!event || event.rewardsDistributed) return;

    if (!event.exclusiveRewards?.length) {
      event.rewardsDistributed = true;
      await this.eventRepository.save(event);
      return;
    }

    const leaderboard = await this.getLeaderboard(eventId, 100);

    for (const reward of event.exclusiveRewards) {
      for (const entry of leaderboard) {
        const qualifiesByRank = reward.rank !== undefined && entry.rank <= reward.rank;
        const qualifiesByScore = reward.minScore !== undefined && entry.score >= reward.minScore;

        if (!qualifiesByRank && !qualifiesByScore) continue;

        const participation = await this.participationRepository.findOne({
          where: { userId: entry.userId, eventId },
        });

        if (!participation) continue;

        const alreadyEarned = participation.rewardsEarned.some(
          (r) => r.rewardId === reward.rewardId,
        );

        if (!alreadyEarned) {
          participation.rewardsEarned.push({
            rewardId: reward.rewardId,
            rewardName: reward.name,
            rewardType: reward.type,
            earnedAt: new Date(),
          });
          await this.participationRepository.save(participation);
          this.logger.log(
            `Distributed end-reward "${reward.name}" to user ${entry.userId} for event ${eventId}`,
          );
        }
      }
    }

    event.rewardsDistributed = true;
    await this.eventRepository.save(event);
  }

  // ─── Analytics ─────────────────────────────────────────────────────────────

  async getAnalytics(eventId: string): Promise<EventAnalytics> {
    const event = await this.findOne(eventId);

    const participations = await this.participationRepository.find({
      where: { eventId },
    });

    const milestones = await this.milestoneRepository.find({
      where: { eventId },
    });

    const totalScore = participations.reduce((sum, p) => sum + p.score, 0);
    const averageScore = participations.length ? totalScore / participations.length : 0;

    const milestoneCompletionRates = milestones.map((m) => {
      const participantsReached = participations.filter((p) =>
        p.milestonesReached.some((mr) => mr.milestoneId === m.id),
      ).length;

      return {
        milestoneId: m.id,
        milestoneName: m.name,
        requiredScore: m.requiredScore,
        participantsReached,
        completionRate: participations.length
          ? participantsReached / participations.length
          : 0,
      };
    });

    const topParticipants = participations
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((p) => ({ userId: p.userId, score: p.score }));

    return {
      eventId,
      participantCount: event.participantCount,
      totalActionsPerformed: event.analytics.totalActionsPerformed ?? 0,
      averageScore,
      milestoneCompletionRates,
      topParticipants,
      dailyEngagement: event.analytics.dailyParticipants ?? {},
    };
  }

  // ─── Participation Verification ────────────────────────────────────────────

  async verifyParticipation(
    eventId: string,
    userId: string,
  ): Promise<EventParticipation> {
    const participation = await this.participationRepository.findOne({
      where: { userId, eventId },
    });

    if (!participation) {
      throw new NotFoundException(
        `No participation record for user ${userId} in event ${eventId}`,
      );
    }

    participation.isVerified = true;
    return this.participationRepository.save(participation);
  }

  async getParticipation(
    eventId: string,
    userId: string,
  ): Promise<EventParticipation> {
    const participation = await this.participationRepository.findOne({
      where: { userId, eventId },
    });

    if (!participation) {
      throw new NotFoundException(
        `No participation record for user ${userId} in event ${eventId}`,
      );
    }

    return participation;
  }
}
