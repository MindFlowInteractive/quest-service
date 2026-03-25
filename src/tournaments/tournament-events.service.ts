import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThan, Between } from 'typeorm';
import { TournamentEvent } from './entities/tournament-event.entity';
import { TournamentEventParticipant } from './entities/tournament-event-participant.entity';
import { CreateTournamentEventDto } from './dto/create-tournament-event.dto';
import { QueryTournamentEventsDto } from './dto/query-tournament-events.dto';

@Injectable()
export class TournamentEventsService {
  private readonly logger = new Logger(TournamentEventsService.name);

  constructor(
    @InjectRepository(TournamentEvent)
    private readonly tournamentEventRepository: Repository<TournamentEvent>,
    @InjectRepository(TournamentEventParticipant)
    private readonly participantRepository: Repository<TournamentEventParticipant>,
  ) {}

  async create(
    createTournamentEventDto: CreateTournamentEventDto,
    createdBy?: string,
  ): Promise<TournamentEvent> {
    this.logger.log(`Creating tournament event: ${createTournamentEventDto.name}`);

    // Validate dates
    const startAt = new Date(createTournamentEventDto.startAt);
    const endAt = new Date(createTournamentEventDto.endAt);

    if (startAt >= endAt) {
      throw new BadRequestException('Start time must be before end time');
    }

    if (startAt <= new Date()) {
      throw new BadRequestException('Start time must be in the future');
    }

    const tournamentEvent = this.tournamentEventRepository.create({
      ...createTournamentEventDto,
      startAt,
      endAt,
      createdBy,
      status: 'draft',
      currentParticipants: 0,
      finalStandings: { rankings: [] },
    });

    return await this.tournamentEventRepository.save(tournamentEvent);
  }

  async findAll(query: QueryTournamentEventsDto): Promise<{
    tournaments: TournamentEvent[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      status,
      startDate,
      endDate,
      page = 1,
      limit = 10,
      sortBy = 'startAt',
      sortOrder = 'DESC',
    } = query;

    const queryBuilder =
      this.tournamentEventRepository.createQueryBuilder('tournamentEvent');

    if (status) {
      queryBuilder.andWhere('tournamentEvent.status = :status', { status });
    }

    if (startDate && endDate) {
      queryBuilder.andWhere(
        'tournamentEvent.startAt BETWEEN :startDate AND :endDate',
        {
          startDate,
          endDate,
        },
      );
    } else if (startDate) {
      queryBuilder.andWhere('tournamentEvent.startAt >= :startDate', {
        startDate,
      });
    }

    queryBuilder
      .orderBy(`tournamentEvent.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit);

    const [tournaments, total] = await queryBuilder.getManyAndCount();

    return {
      tournaments,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<TournamentEvent> {
    const tournamentEvent = await this.tournamentEventRepository.findOne({
      where: { id },
      relations: ['participants'],
    });

    if (!tournamentEvent) {
      throw new NotFoundException('Tournament event not found');
    }

    return tournamentEvent;
  }

  async registerParticipant(
    tournamentEventId: string,
    userId: string,
    username: string,
  ): Promise<TournamentEventParticipant> {
    this.logger.log(`Registering user ${userId} for tournament event ${tournamentEventId}`);

    const tournamentEvent = await this.findOne(tournamentEventId);

    if (tournamentEvent.status !== 'upcoming' && tournamentEvent.status !== 'active') {
      throw new BadRequestException('Tournament event is not open for registration');
    }

    if (tournamentEvent.currentParticipants >= tournamentEvent.maxParticipants) {
      throw new BadRequestException('Tournament event is full');
    }

    // Check if user is already registered
    const existingParticipant = await this.participantRepository.findOne({
      where: { tournamentEventId, userId },
    });

    if (existingParticipant) {
      throw new BadRequestException('User is already registered for this tournament event');
    }

    const participant = this.participantRepository.create({
      tournamentEventId,
      userId,
      username,
      status: 'registered',
      totalScore: 0,
      puzzlesSolved: 0,
      puzzleResults: [],
    });

    const savedParticipant = await this.participantRepository.save(participant);

    // Update participant count
    await this.tournamentEventRepository.update(tournamentEventId, {
      currentParticipants: tournamentEvent.currentParticipants + 1,
    });

    return savedParticipant;
  }

  async getStandings(tournamentEventId: string): Promise<{
    rankings: Array<{
      userId: string;
      username: string;
      totalScore: number;
      position: number;
      puzzlesSolved: number;
    }>;
    tournamentEvent: TournamentEvent;
  }> {
    const tournamentEvent = await this.findOne(tournamentEventId);

    if (tournamentEvent.status === 'completed') {
      return {
        rankings: tournamentEvent.finalStandings.rankings,
        tournamentEvent,
      };
    }

    // Calculate live standings
    const participants = await this.participantRepository.find({
      where: { tournamentEventId },
      order: { totalScore: 'DESC', puzzlesSolved: 'DESC' },
    });

    const rankings = participants.map((participant, index) => ({
      userId: participant.userId,
      username: participant.username,
      totalScore: participant.totalScore,
      position: index + 1,
      puzzlesSolved: participant.puzzlesSolved,
    }));

    return {
      rankings,
      tournamentEvent,
    };
  }

  async getResults(tournamentEventId: string): Promise<{
    podium: Array<{
      userId: string;
      username: string;
      totalScore: number;
      position: number;
      puzzlesSolved: number;
      prizeAwarded?: any;
    }>;
    finalStandings: any;
    tournamentEvent: TournamentEvent;
  }> {
    const tournamentEvent = await this.findOne(tournamentEventId);

    if (tournamentEvent.status !== 'completed') {
      throw new BadRequestException('Tournament event is not completed yet');
    }

    const podium = tournamentEvent.finalStandings.rankings.slice(0, 3);

    return {
      podium,
      finalStandings: tournamentEvent.finalStandings,
      tournamentEvent,
    };
  }

  async updateStatus(id: string, status: 'draft' | 'upcoming' | 'active' | 'completed'): Promise<TournamentEvent> {
    const tournamentEvent = await this.findOne(id);

    // Validate status transitions
    const validTransitions = {
      draft: ['upcoming'],
      upcoming: ['active', 'draft'],
      active: ['completed'],
      completed: [], // Final state
    };

    if (!validTransitions[tournamentEvent.status].includes(status)) {
      throw new BadRequestException(`Invalid status transition from ${tournamentEvent.status} to ${status}`);
    }

    if (status === 'completed') {
      await this.computeFinalStandings(id);
    }

    await this.tournamentEventRepository.update(id, { status });
    return await this.findOne(id);
  }

  private async computeFinalStandings(tournamentEventId: string): Promise<void> {
    const participants = await this.participantRepository.find({
      where: { tournamentEventId },
      order: { totalScore: 'DESC', puzzlesSolved: 'DESC', registeredAt: 'ASC' },
    });

    const rankings = participants.map((participant, index) => ({
      userId: participant.userId,
      username: participant.username,
      totalScore: participant.totalScore,
      position: index + 1,
      puzzlesSolved: participant.puzzlesSolved,
    }));

    // Update final positions and prizes
    for (const participant of participants) {
      const ranking = rankings.find(r => r.userId === participant.userId);
      if (ranking) {
        participant.finalPosition = ranking.position;
        // TODO: Assign prizes based on rewardPool distribution
      }
      await this.participantRepository.save(participant);
    }

    await this.tournamentEventRepository.update(tournamentEventId, {
      finalStandings: {
        rankings,
        computedAt: new Date(),
      },
    });
  }

  // Method to be called by cron job
  async processScheduledEvents(): Promise<void> {
    const now = new Date();

    // Activate upcoming events
    const eventsToActivate = await this.tournamentEventRepository.find({
      where: {
        status: 'upcoming',
        startAt: LessThan(now),
      },
    });

    for (const event of eventsToActivate) {
      await this.updateStatus(event.id, 'active');
      this.logger.log(`Activated tournament event: ${event.name}`);
    }

    // Complete active events
    const eventsToComplete = await this.tournamentEventRepository.find({
      where: {
        status: 'active',
        endAt: LessThan(now),
      },
    });

    for (const event of eventsToComplete) {
      await this.updateStatus(event.id, 'completed');
      this.logger.log(`Completed tournament event: ${event.name}`);
    }
  }

  // Method to update participant score when they solve a puzzle during the event
  async updateParticipantScore(
    tournamentEventId: string,
    userId: string,
    puzzleId: string,
    score: number,
    timeTaken?: number,
  ): Promise<void> {
    const participant = await this.participantRepository.findOne({
      where: { tournamentEventId, userId },
    });

    if (!participant) {
      return; // User not registered for this event
    }

    // Check if puzzle is part of this tournament
    const tournamentEvent = await this.findOne(tournamentEventId);
    if (!tournamentEvent.puzzleIds.includes(puzzleId)) {
      return; // Puzzle not part of this tournament
    }

    // Check if score for this puzzle already exists
    const existingResult = participant.puzzleResults.find(r => r.puzzleId === puzzleId);
    if (existingResult) {
      // Update existing score if better
      if (score > existingResult.score) {
        existingResult.score = score;
        existingResult.completedAt = new Date();
        if (timeTaken) existingResult.timeTaken = timeTaken;
        participant.totalScore = participant.puzzleResults.reduce((sum, r) => sum + r.score, 0);
      }
    } else {
      // Add new puzzle result
      participant.puzzleResults.push({
        puzzleId,
        score,
        completedAt: new Date(),
        timeTaken,
      });
      participant.totalScore += score;
      participant.puzzlesSolved += 1;
    }

    await this.participantRepository.save(participant);
  }
}