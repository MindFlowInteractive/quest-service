import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan, Between } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SeasonalEvent } from '../entities/seasonal-event.entity';
import { CreateEventDto } from '../dto/create-event.dto';

@Injectable()
export class SeasonalEventService {
  private readonly logger = new Logger(SeasonalEventService.name);

  constructor(
    @InjectRepository(SeasonalEvent)
    private readonly eventRepository: Repository<SeasonalEvent>,
  ) {}

  /**
   * Cron job to automatically activate/deactivate events
   * Runs every 5 minutes
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
          startDate: LessThan(now),
          endDate: MoreThan(now),
        },
      });

      for (const event of eventsToActivate) {
        event.isActive = true;
        await this.eventRepository.save(event);
        this.logger.log(`Activated event: ${event.name} (${event.id})`);
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

      this.logger.log(
        `Event activation complete. Activated: ${eventsToActivate.length}, Deactivated: ${eventsToDeactivate.length}`,
      );
    } catch (error) {
      this.logger.error('Error in event activation cron job', error);
    }
  }

  /**
   * Create a new seasonal event
   */
  async createEvent(createEventDto: CreateEventDto): Promise<SeasonalEvent> {
    // Validate dates
    if (createEventDto.startDate >= createEventDto.endDate) {
      throw new BadRequestException('Start date must be before end date');
    }

    const event = this.eventRepository.create({
      ...createEventDto,
      isActive: false, // Will be activated by cron job
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
    const where: any = {};

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

    // Validate dates if being updated
    if (updateData.startDate || updateData.endDate) {
      const startDate = updateData.startDate || event.startDate;
      const endDate = updateData.endDate || event.endDate;

      if (startDate >= endDate) {
        throw new BadRequestException('Start date must be before end date');
      }
    }

    Object.assign(event, updateData);

    // Recalculate isActive status
    const now = new Date();
    if (
      event.isPublished &&
      event.startDate <= now &&
      event.endDate > now
    ) {
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
   * Get upcoming events
   */
  async findUpcomingEvents(): Promise<SeasonalEvent[]> {
    const now = new Date();
    return await this.eventRepository.find({
      where: {
        isPublished: true,
        startDate: MoreThan(now),
      },
      order: { startDate: 'ASC' },
      take: 10,
    });
  }

  /**
   * Get past events
   */
  async findPastEvents(limit: number = 10): Promise<SeasonalEvent[]> {
    const now = new Date();
    return await this.eventRepository.find({
      where: {
        endDate: LessThan(now),
      },
      order: { endDate: 'DESC' },
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
}
