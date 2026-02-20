import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SeasonalEvent } from '../entities/seasonal-event.entity';
import { EventPuzzle } from '../entities/event-puzzle.entity';
import { EventReward } from '../entities/event-reward.entity';
import { CreateEventDto } from '../dto/create-event.dto';
import { NotificationService } from '../../notifications/notification.service';

@Injectable()
export class SeasonalEventService {
  private readonly logger = new Logger(SeasonalEventService.name);

  constructor(
    @InjectRepository(SeasonalEvent)
    private readonly eventRepository: Repository<SeasonalEvent>,
    @InjectRepository(EventPuzzle)
    private readonly puzzleRepository: Repository<EventPuzzle>,
    @InjectRepository(EventReward)
    private readonly rewardRepository: Repository<EventReward>,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Cron job to automatically activate/deactivate events.
   * Runs every 5 minutes.
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleEventActivation() {
    this.logger.log('Running event activation/deactivation cron job');

    const now = new Date();

    try {
      // Activate events that should be active
      const eventsToActivate = await this.eventRepository.find({
        where: {
          isActive: false,
          isPublished: true,
          isArchived: false,
          startDate: LessThan(now),
          endDate: MoreThan(now),
        },
      });

      for (const event of eventsToActivate) {
        event.isActive = true;
        await this.eventRepository.save(event);
        this.logger.log(`Activated event: ${event.name} (${event.id})`);
        await this.announceEventOnActivation(event);
      }

      // Deactivate events that should no longer be active
      const eventsToDeactivate = await this.eventRepository.find({
        where: {
          isActive: true,
          endDate: LessThan(now),
        },
      });

      for (const event of eventsToDeactivate) {
        event.isActive = false;
        await this.eventRepository.save(event);
        this.logger.log(`Deactivated event: ${event.name} (${event.id})`);
      }

      // Auto-archive events that ended more than 7 days ago and are not yet archived
      const archiveThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const eventsToAutoArchive = await this.eventRepository.find({
        where: {
          isActive: false,
          isArchived: false,
          endDate: LessThan(archiveThreshold),
        },
      });

      for (const event of eventsToAutoArchive) {
        event.isArchived = true;
        event.archivedAt = now;
        await this.eventRepository.save(event);
        this.logger.log(`Auto-archived event: ${event.name} (${event.id})`);
      }

      this.logger.log(
        `Event activation complete. Activated: ${eventsToActivate.length}, Deactivated: ${eventsToDeactivate.length}, Auto-archived: ${eventsToAutoArchive.length}`,
      );
    } catch (error) {
      this.logger.error('Error in event activation cron job', error);
    }
  }

  /**
   * Cron job to spawn new instances of recurring events.
   * Runs daily at midnight.
   * Only spawns if the next scheduled window (template.endDate + intervalDays) is now or in the past,
   * preventing duplicate spawning on consecutive runs.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleRecurringEvents() {
    this.logger.log('Running recurring event cron job');

    const now = new Date();

    try {
      const recurringTemplates = await this.eventRepository.find({
        where: {
          isRecurring: true,
          isArchived: false,
          endDate: LessThan(now),
        },
        relations: ['puzzles', 'rewards'],
      });

      for (const template of recurringTemplates) {
        const config = template.recurrenceConfig;
        if (!config) continue;

        // Ensure occurrenceCount is always a number (default 0 if undefined)
        const occurrenceCount = config.occurrenceCount ?? 0;

        // Skip if max occurrences reached
        if (
          config.maxOccurrences !== undefined &&
          config.maxOccurrences !== null &&
          occurrenceCount >= config.maxOccurrences
        ) {
          continue;
        }

        // intervalDays is the period of recurrence — shift both start and end by the same interval.
        // e.g. a 7-day event with intervalDays=7 repeats every 7 days (no gap between occurrences).
        const intervalMs = config.intervalDays * 24 * 60 * 60 * 1000;
        const newStartDate = new Date(template.startDate.getTime() + intervalMs);
        const newEndDate = new Date(template.endDate.getTime() + intervalMs);

        // Guard: only spawn if the next window's start is at or before now,
        // preventing duplicate spawning on consecutive midnight runs.
        if (newStartDate > now) {
          continue;
        }

        // Create new event instance cloned from template
        const newEvent = this.eventRepository.create({
          name: template.name,
          description: template.description,
          theme: template.theme,
          startDate: newStartDate,
          endDate: newEndDate,
          isPublished: template.isPublished,
          bannerImage: template.bannerImage,
          metadata: template.metadata,
          isRecurring: false, // child instances are not templates
          recurrenceConfig: {
            intervalDays: config.intervalDays,
            maxOccurrences: config.maxOccurrences,
            occurrenceCount: 0,
            parentEventId: template.id,
          },
        });

        // Check if it should be immediately active
        if (newEvent.isPublished && newStartDate <= now && newEndDate > now) {
          newEvent.isActive = true;
        }

        const savedEvent = await this.eventRepository.save(newEvent);

        // Clone puzzles — strip runtime-only fields and the loaded relation object
        for (const puzzle of template.puzzles ?? []) {
          const { id: _id, createdAt: _c, updatedAt: _u, completionCount: _cc, attemptCount: _ac, event: _ev, ...puzzleData } = puzzle as any;
          await this.puzzleRepository.save(
            this.puzzleRepository.create({ ...puzzleData, eventId: savedEvent.id }),
          );
        }

        // Clone rewards — strip runtime-only fields and the loaded relation object
        for (const reward of template.rewards ?? []) {
          const { id: _id, createdAt: _c, updatedAt: _u, claimedCount: _cl, event: _ev, ...rewardData } = reward as any;
          await this.rewardRepository.save(
            this.rewardRepository.create({ ...rewardData, eventId: savedEvent.id }),
          );
        }

        // Advance the template's own dates by one interval so the next run's guard
        // does not fire immediately, and increment occurrenceCount.
        template.startDate = newStartDate;
        template.endDate = newEndDate;
        template.recurrenceConfig = {
          ...config,
          occurrenceCount: occurrenceCount + 1,
        };
        await this.eventRepository.save(template);

        this.logger.log(
          `Spawned recurring instance for event: ${template.name} (new id: ${savedEvent.id})`,
        );
      }
    } catch (error) {
      this.logger.error('Error in recurring events cron job', error);
    }
  }

  /**
   * Create a new seasonal event
   */
  async createEvent(createEventDto: CreateEventDto): Promise<SeasonalEvent> {
    if (createEventDto.startDate >= createEventDto.endDate) {
      throw new BadRequestException('Start date must be before end date');
    }

    const event = this.eventRepository.create({
      ...createEventDto,
      isActive: false,
      // Normalise occurrenceCount to 0 if a recurrenceConfig is provided without it
      recurrenceConfig: createEventDto.recurrenceConfig
        ? { occurrenceCount: 0, ...createEventDto.recurrenceConfig }
        : undefined,
    });

    // Check if event should be immediately active
    const now = new Date();
    if (
      createEventDto.isPublished !== false &&
      createEventDto.startDate <= now &&
      createEventDto.endDate > now
    ) {
      event.isActive = true;
    }

    return await this.eventRepository.save(event);
  }

  /**
   * Get all events (with optional filters)
   */
  async findAll(filters?: {
    isActive?: boolean;
    isPublished?: boolean;
  }): Promise<SeasonalEvent[]> {
    const where: any = { isArchived: false };

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.isPublished !== undefined) {
      where.isPublished = filters.isPublished;
    }

    return await this.eventRepository.find({
      where,
      relations: ['puzzles', 'rewards'],
      order: { startDate: 'DESC' },
    });
  }

  /**
   * Get active events only
   */
  async findActiveEvents(): Promise<SeasonalEvent[]> {
    return await this.eventRepository.find({
      where: {
        isActive: true,
        isPublished: true,
        isArchived: false,
      },
      relations: ['puzzles', 'rewards'],
      order: { startDate: 'DESC' },
    });
  }

  /**
   * Get a single event by ID
   */
  async findOne(id: string): Promise<SeasonalEvent> {
    const event = await this.eventRepository.findOne({
      where: { id },
      relations: ['puzzles', 'rewards', 'playerEvents'],
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    return event;
  }

  /**
   * Update an event
   */
  async updateEvent(
    id: string,
    updateData: Partial<CreateEventDto>,
  ): Promise<SeasonalEvent> {
    const event = await this.findOne(id);

    if (updateData.startDate || updateData.endDate) {
      const startDate = updateData.startDate || event.startDate;
      const endDate = updateData.endDate || event.endDate;

      if (startDate >= endDate) {
        throw new BadRequestException('Start date must be before end date');
      }
    }

    Object.assign(event, updateData);

    const now = new Date();
    if (event.isPublished && event.startDate <= now && event.endDate > now) {
      event.isActive = true;
    } else if (event.endDate <= now) {
      event.isActive = false;
    }

    return await this.eventRepository.save(event);
  }

  /**
   * Delete an event
   */
  async deleteEvent(id: string): Promise<void> {
    const event = await this.findOne(id);
    await this.eventRepository.remove(event);
    this.logger.log(`Deleted event: ${event.name} (${id})`);
  }

  /**
   * Archive an event (soft archive)
   */
  async archiveEvent(id: string): Promise<SeasonalEvent> {
    const event = await this.findOne(id);
    event.isArchived = true;
    event.archivedAt = new Date();
    event.isActive = false;
    const saved = await this.eventRepository.save(event);
    this.logger.log(`Archived event: ${event.name} (${id})`);
    return saved;
  }

  /**
   * Get upcoming events
   */
  async findUpcomingEvents(): Promise<SeasonalEvent[]> {
    const now = new Date();
    return await this.eventRepository.find({
      where: {
        isPublished: true,
        isArchived: false,
        startDate: MoreThan(now),
      },
      order: { startDate: 'ASC' },
      take: 10,
    });
  }

  /**
   * Get past events (ended but not archived)
   */
  async findPastEvents(limit: number = 10): Promise<SeasonalEvent[]> {
    const now = new Date();
    return await this.eventRepository.find({
      where: {
        isArchived: false,
        endDate: LessThan(now),
      },
      order: { endDate: 'DESC' },
      take: limit,
    });
  }

  /**
   * Get archived events (history)
   */
  async findArchivedEvents(limit: number = 20): Promise<SeasonalEvent[]> {
    return await this.eventRepository.find({
      where: { isArchived: true },
      order: { archivedAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Increment participant count
   */
  async incrementParticipantCount(eventId: string): Promise<void> {
    await this.eventRepository.increment({ id: eventId }, 'participantCount', 1);
  }

  /**
   * Increment total puzzles completed
   */
  async incrementPuzzlesCompleted(eventId: string): Promise<void> {
    await this.eventRepository.increment({ id: eventId }, 'totalPuzzlesCompleted', 1);
  }

  /**
   * Get event statistics
   */
  async getEventStatistics(eventId: string): Promise<{
    event: SeasonalEvent;
    stats: {
      participantCount: number;
      totalPuzzlesCompleted: number;
      averageScore: number;
      completionRate: number;
    };
  }> {
    const event = await this.findOne(eventId);

    const playerEvents = event.playerEvents || [];
    const totalScore = playerEvents.reduce((sum, pe) => sum + pe.score, 0);
    const averageScore = playerEvents.length > 0 ? totalScore / playerEvents.length : 0;

    const totalPuzzles = event.puzzles?.length || 0;
    const completionRate =
      totalPuzzles > 0 && event.totalPuzzlesCompleted > 0
        ? (event.totalPuzzlesCompleted / (totalPuzzles * event.participantCount)) * 100
        : 0;

    return {
      event,
      stats: {
        participantCount: event.participantCount,
        totalPuzzlesCompleted: event.totalPuzzlesCompleted,
        averageScore: Math.round(averageScore),
        completionRate: Math.round(completionRate * 100) / 100,
      },
    };
  }

  /**
   * Announce an event to all active users via NotificationService.
   * Targets users with status='active' (the canonical active-user field on User entity).
   * Called automatically on cron activation and manually via controller.
   */
  async announceEvent(event: SeasonalEvent): Promise<void> {
    try {
      await this.notificationService.createNotificationForUsers({
        segment: { key: 'status', value: 'active' },
        type: 'event_announcement',
        title: `New Event: ${event.name}`,
        body: event.description,
        meta: {
          eventId: event.id,
          startDate: event.startDate,
          endDate: event.endDate,
          theme: event.theme,
          bannerImage: event.bannerImage,
        },
      });
      this.logger.log(`Announced event: ${event.name} (${event.id})`);
    } catch (error) {
      this.logger.error(`Failed to announce event ${event.id}`, error);
    }
  }

  private async announceEventOnActivation(event: SeasonalEvent): Promise<void> {
    await this.announceEvent(event);
  }
}
