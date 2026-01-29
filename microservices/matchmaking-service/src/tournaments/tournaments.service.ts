import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThan, Between } from 'typeorm';
import { Tournament } from './entities/tournament.entity';
import { TournamentParticipant } from './entities/tournament-participant.entity';
import { TournamentMatch } from './entities/tournament-match.entity';
import { TournamentSpectator } from './entities/tournament-spectator.entity';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';
import { QueryTournamentsDto } from './dto/query-tournaments.dto';
import {
  BracketNode,
  TournamentBracket,
  BracketRound,
  MatchPairing,
} from './types/tournament.types';

@Injectable()
export class TournamentsService {
  private readonly logger = new Logger(TournamentsService.name);

  constructor(
    @InjectRepository(Tournament)
    private readonly tournamentRepository: Repository<Tournament>,
    @InjectRepository(TournamentParticipant)
    private readonly participantRepository: Repository<TournamentParticipant>,
    @InjectRepository(TournamentMatch)
    private readonly matchRepository: Repository<TournamentMatch>,
    @InjectRepository(TournamentSpectator)
    private readonly spectatorRepository: Repository<TournamentSpectator>,
  ) { }

  async create(
    createTournamentDto: CreateTournamentDto,
    createdBy?: string,
  ): Promise<Tournament> {
    this.logger.log(`Creating tournament: ${createTournamentDto.name}`);

    const tournament = this.tournamentRepository.create({
      ...createTournamentDto,
      createdBy,
      status: 'scheduled',
      currentParticipants: 0,
      bracket: {
        rounds: [],
        totalRounds: 0,
        currentRound: 0,
      },
      statistics: {
        totalMatches: 0,
        completedMatches: 0,
        topPerformers: [],
      },
    });

    return await this.tournamentRepository.save(tournament);
  }

  async findAll(query: QueryTournamentsDto): Promise<{
    tournaments: Tournament[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      status,
      bracketType,
      startDate,
      endDate,
      page = 1,
      limit = 10,
      sortBy = 'startTime',
      sortOrder = 'DESC',
    } = query;

    const queryBuilder =
      this.tournamentRepository.createQueryBuilder('tournament');

    if (status) {
      queryBuilder.andWhere('tournament.status = :status', { status });
    }

    if (bracketType) {
      queryBuilder.andWhere('tournament.bracketType = :bracketType', {
        bracketType,
      });
    }

    if (startDate && endDate) {
      queryBuilder.andWhere(
        'tournament.startTime BETWEEN :startDate AND :endDate',
        {
          startDate,
          endDate,
        },
      );
    } else if (startDate) {
      queryBuilder.andWhere('tournament.startTime >= :startDate', {
        startDate,
      });
    } else if (endDate) {
      queryBuilder.andWhere('tournament.startTime <= :endDate', { endDate });
    }

    queryBuilder
      .orderBy(`tournament.${sortBy}`, sortOrder)
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

  async findOne(id: string): Promise<Tournament> {
    const tournament = await this.tournamentRepository.findOne({
      where: { id },
      relations: ['participants', 'matches'],
    });
    if (!tournament) {
      throw new NotFoundException(`Tournament with ID ${id} not found`);
    }
    return tournament;
  }

  async update(
    id: string,
    updateTournamentDto: UpdateTournamentDto,
  ): Promise<Tournament> {
    await this.tournamentRepository.update(id, updateTournamentDto);
    return await this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.tournamentRepository.delete(id);
  }

  // Registration system
  async registerParticipant(
    tournamentId: string,
    userId: string,
    username: string,
    metadata?: any,
  ): Promise<TournamentParticipant> {
    this.logger.log(
      `Registering participant ${username} for tournament ${tournamentId}`,
    );

    const tournament = await this.findOne(tournamentId);

    if (!tournament) {
      throw new Error('Tournament not found');
    }

    if (
      tournament.status !== 'registration' &&
      tournament.status !== 'scheduled'
    ) {
      throw new Error('Tournament registration is closed');
    }

    if (tournament.currentParticipants >= tournament.maxParticipants) {
      throw new Error('Tournament is full');
    }

    const now = new Date();
    if (now < new Date(tournament.registrationStartTime)) {
      throw new Error('Registration has not started yet');
    }

    if (now > new Date(tournament.registrationEndTime)) {
      throw new Error('Registration has ended');
    }

    // Check if already registered
    const existingParticipant = await this.participantRepository.findOne({
      where: { tournamentId, userId },
    });

    if (existingParticipant) {
      throw new Error('Already registered for this tournament');
    }

    const participant = this.participantRepository.create({
      tournamentId,
      userId,
      username,
      status: 'registered',
      registeredAt: new Date(),
      metadata,
      statistics: {},
    });

    await this.participantRepository.save(participant);

    // Update participant count
    await this.tournamentRepository.update(tournamentId, {
      currentParticipants: tournament.currentParticipants + 1,
    });

    return participant;
  }

  async withdrawParticipant(
    tournamentId: string,
    userId: string,
  ): Promise<void> {
    const participant = await this.participantRepository.findOne({
      where: { tournamentId, userId },
    });

    if (!participant) {
      throw new Error('Participant not found');
    }

    if (
      participant.status === 'active' ||
      participant.status === 'eliminated'
    ) {
      throw new Error('Cannot withdraw after tournament has started');
    }

    await this.participantRepository.update(participant.id, {
      status: 'withdrawn',
      withdrawnAt: new Date(),
    });

    const tournament = await this.findOne(tournamentId);
    await this.tournamentRepository.update(tournamentId, {
      currentParticipants: Math.max(0, tournament.currentParticipants - 1),
    });
  }

  // Bracket generation
  async generateBracket(tournamentId: string): Promise<TournamentBracket> {
    this.logger.log(`Generating bracket for tournament ${tournamentId}`);

    const tournament = await this.findOne(tournamentId);
    const participants = await this.participantRepository.find({
      where: { tournamentId, status: 'registered' },
    });

    if (participants.length < 2) {
      throw new Error('Not enough participants to generate bracket');
    }

    const bracketType = tournament.bracketType;

    let bracket: TournamentBracket;

    switch (bracketType) {
      case 'single-elimination':
        bracket = await this.generateSingleEliminationBracket(
          tournament,
          participants,
        );
        break;
      case 'double-elimination':
        bracket = await this.generateDoubleEliminationBracket(
          tournament,
          participants,
        );
        break;
      case 'round-robin':
        bracket = await this.generateRoundRobinBracket(
          tournament,
          participants,
        );
        break;
      case 'swiss':
        bracket = await this.generateSwissBracket(tournament, participants);
        break;
      default:
        throw new Error(`Unsupported bracket type: ${bracketType}`);
    }

    // Save bracket to tournament
    await this.tournamentRepository.update(tournamentId, {
      bracket: {
        rounds: bracket.rounds.map((r) => ({
          roundNumber: r.roundNumber,
          roundName: r.roundName,
          matches: r.matches.map((m) => m.matchId),
          startTime: r.startTime,
          endTime: r.endTime,
        })),
        totalRounds: bracket.totalRounds,
        currentRound: 1,
      },
      status: 'in-progress',
    });

    return bracket;
  }

  private async generateSingleEliminationBracket(
    tournament: Tournament,
    participants: TournamentParticipant[],
  ): Promise<TournamentBracket> {
    // Seed participants
    const seededParticipants = await this.seedParticipants(
      participants,
      tournament,
    );

    // Calculate number of rounds (log2 of next power of 2)
    const nextPowerOf2 = Math.pow(
      2,
      Math.ceil(Math.log2(seededParticipants.length)),
    );
    const totalRounds = Math.log2(nextPowerOf2);

    const rounds: BracketRound[] = [];
    let currentMatches: BracketNode[] = [];

    // First round
    const firstRoundMatches = Math.ceil(seededParticipants.length / 2);
    const roundNames = this.getRoundNames(totalRounds);

    for (let i = 0; i < firstRoundMatches; i++) {
      const player1 = seededParticipants[i * 2];
      const player2 = seededParticipants[i * 2 + 1];

      const match = await this.createMatch(
        tournament.id,
        1,
        i + 1,
        player1,
        player2,
      );

      currentMatches.push({
        matchId: match.id,
        roundNumber: 1,
        matchNumber: i + 1,
        player1: player1
          ? { id: player1.id, name: player1.username, seed: player1.seedNumber }
          : undefined,
        player2: player2
          ? { id: player2.id, name: player2.username, seed: player2.seedNumber }
          : undefined,
        status: 'scheduled',
      });
    }

    rounds.push({
      roundNumber: 1,
      roundName: roundNames[0],
      matches: currentMatches,
      isComplete: false,
    });

    // Subsequent rounds
    for (let round = 2; round <= totalRounds; round++) {
      const prevMatches = currentMatches;
      currentMatches = [];
      const matchesInRound = Math.ceil(prevMatches.length / 2);

      for (let i = 0; i < matchesInRound; i++) {
        const match = await this.createMatch(tournament.id, round, i + 1);

        // Link previous matches to this match
        if (prevMatches[i * 2]) {
          await this.matchRepository.update(prevMatches[i * 2].matchId, {
            nextMatchId: match.id,
          });
        }
        if (prevMatches[i * 2 + 1]) {
          await this.matchRepository.update(prevMatches[i * 2 + 1].matchId, {
            nextMatchId: match.id,
          });
        }

        currentMatches.push({
          matchId: match.id,
          roundNumber: round,
          matchNumber: i + 1,
          status: 'scheduled',
        });
      }

      rounds.push({
        roundNumber: round,
        roundName: roundNames[round - 1],
        matches: currentMatches,
        isComplete: false,
      });
    }

    return {
      tournamentId: tournament.id,
      bracketType: 'single-elimination',
      rounds,
      totalRounds,
      currentRound: 1,
    };
  }

  private async generateDoubleEliminationBracket(
    tournament: Tournament,
    participants: TournamentParticipant[],
  ): Promise<TournamentBracket> {
    // Similar to single elimination but with loser bracket
    // Simplified implementation - would need more complex logic for full double elimination
    return await this.generateSingleEliminationBracket(
      tournament,
      participants,
    );
  }

  private async generateRoundRobinBracket(
    tournament: Tournament,
    participants: TournamentParticipant[],
  ): Promise<TournamentBracket> {
    const n = participants.length;
    const totalRounds = n % 2 === 0 ? n - 1 : n;
    const rounds: BracketRound[] = [];

    // Round-robin algorithm
    for (let round = 1; round <= totalRounds; round++) {
      const matches: BracketNode[] = [];

      for (let i = 0; i < Math.floor(n / 2); i++) {
        const player1Idx = i;
        const player2Idx = n - 1 - i;

        if (player1Idx !== player2Idx) {
          const player1 = participants[player1Idx];
          const player2 = participants[player2Idx];

          const match = await this.createMatch(
            tournament.id,
            round,
            i + 1,
            player1,
            player2,
          );

          matches.push({
            matchId: match.id,
            roundNumber: round,
            matchNumber: i + 1,
            player1: { id: player1.id, name: player1.username },
            player2: { id: player2.id, name: player2.username },
            status: 'scheduled',
          });
        }
      }

      rounds.push({
        roundNumber: round,
        roundName: `Round ${round}`,
        matches,
        isComplete: false,
      });

      // Rotate participants for next round
      const temp = participants.splice(1, 1)[0];
      participants.push(temp);
    }

    return {
      tournamentId: tournament.id,
      bracketType: 'round-robin',
      rounds,
      totalRounds,
      currentRound: 1,
    };
  }

  private async generateSwissBracket(
    tournament: Tournament,
    participants: TournamentParticipant[],
  ): Promise<TournamentBracket> {
    // Swiss system - pair based on current standings
    // Simplified first round with random pairing
    const rounds: BracketRound[] = [];
    const matches: BracketNode[] = [];

    const shuffled = [...participants].sort(() => Math.random() - 0.5);

    for (let i = 0; i < Math.floor(shuffled.length / 2); i++) {
      const player1 = shuffled[i * 2];
      const player2 = shuffled[i * 2 + 1];

      const match = await this.createMatch(
        tournament.id,
        1,
        i + 1,
        player1,
        player2,
      );

      matches.push({
        matchId: match.id,
        roundNumber: 1,
        matchNumber: i + 1,
        player1: { id: player1.id, name: player1.username },
        player2: { id: player2.id, name: player2.username },
        status: 'scheduled',
      });
    }

    rounds.push({
      roundNumber: 1,
      roundName: 'Round 1',
      matches,
      isComplete: false,
    });

    return {
      tournamentId: tournament.id,
      bracketType: 'swiss',
      rounds,
      totalRounds: Math.ceil(Math.log2(participants.length)),
      currentRound: 1,
    };
  }

  private async seedParticipants(
    participants: TournamentParticipant[],
    tournament: Tournament,
  ): Promise<TournamentParticipant[]> {
    const seedingMethod =
      tournament.rules?.matchmaking?.seedingMethod || 'random';

    let seeded: TournamentParticipant[];

    switch (seedingMethod) {
      case 'ranked':
        seeded = [...participants].sort((a, b) => b.totalScore - a.totalScore);
        break;
      case 'seeded':
        seeded = [...participants].sort(
          (a, b) => (a.seedNumber || 999) - (b.seedNumber || 999),
        );
        break;
      case 'random':
      default:
        seeded = [...participants].sort(() => Math.random() - 0.5);
        break;
    }

    // Assign seed numbers
    for (let i = 0; i < seeded.length; i++) {
      seeded[i].seedNumber = i + 1;
      await this.participantRepository.update(seeded[i].id, {
        seedNumber: i + 1,
        status: 'active',
      });
    }

    return seeded;
  }

  private getRoundNames(totalRounds: number): string[] {
    const names: string[] = [];
    for (let i = totalRounds; i >= 1; i--) {
      if (i === 1) {
        names.push('Finals');
      } else if (i === 2) {
        names.push('Semi-Finals');
      } else if (i === 3) {
        names.push('Quarter-Finals');
      } else {
        names.push(`Round of ${Math.pow(2, i)}`);
      }
    }
    return names.reverse();
  }

  private async createMatch(
    tournamentId: string,
    roundNumber: number,
    matchNumber: number,
    player1?: TournamentParticipant,
    player2?: TournamentParticipant,
  ): Promise<TournamentMatch> {
    const match = this.matchRepository.create({
      tournamentId,
      roundNumber,
      matchNumber,
      player1Id: player1?.id,
      player1Name: player1?.username,
      player2Id: player2?.id,
      player2Name: player2?.username,
      status: 'scheduled',
      player1Score: 0,
      player2Score: 0,
      config: {},
      results: {},
      statistics: {},
      metadata: {},
    });

    return await this.matchRepository.save(match);
  }

  // Match progression
  async submitMatchResult(
    matchId: string,
    winnerId: string,
    player1Score: number,
    player2Score: number,
    puzzleResults?: any,
  ): Promise<void> {
    this.logger.log(`Submitting match result for match ${matchId}`);

    const match = await this.matchRepository.findOne({
      where: { id: matchId },
    });

    if (!match) {
      throw new Error('Match not found');
    }

    if (match.status === 'completed') {
      throw new Error('Match already completed');
    }

    const loserId =
      winnerId === match.player1Id ? match.player2Id : match.player1Id;

    await this.matchRepository.update(matchId, {
      winnerId,
      winnerName:
        winnerId === match.player1Id ? match.player1Name : match.player2Name,
      loserId,
      player1Score,
      player2Score,
      status: 'completed',
      endTime: new Date(),
      duration: match.startTime
        ? Math.floor(
          (new Date().getTime() - new Date(match.startTime).getTime()) / 1000,
        )
        : 0,
      results: {
        puzzleResults,
      },
    });

    // Update participant stats
    if (winnerId) {
      await this.updateParticipantStats(
        match.tournamentId,
        winnerId,
        true,
        player1Score || player2Score,
      );
    }

    if (loserId) {
      await this.updateParticipantStats(
        match.tournamentId,
        loserId,
        false,
        winnerId === match.player1Id ? player2Score : player1Score,
      );
    }

    // Advance winner to next match
    if (match.nextMatchId) {
      await this.advanceToNextMatch(
        match.nextMatchId,
        winnerId,
        (winnerId === match.player1Id ? match.player1Name : match.player2Name) as string,
      );
    }

    // Check if tournament is complete
    await this.checkTournamentCompletion(match.tournamentId);
  }

  private async updateParticipantStats(
    tournamentId: string,
    participantId: string,
    isWin: boolean,
    score: number,
  ): Promise<void> {
    const participant = await this.participantRepository.findOne({
      where: { id: participantId, tournamentId },
    });

    if (!participant) return;

    await this.participantRepository.update(participantId, {
      wins: isWin ? participant.wins + 1 : participant.wins,
      losses: !isWin ? participant.losses + 1 : participant.losses,
      totalScore: participant.totalScore + score,
    });

    if (!isWin) {
      await this.participantRepository.update(participantId, {
        status: 'eliminated',
        eliminatedAt: new Date(),
      });
    }
  }

  private async advanceToNextMatch(
    nextMatchId: string,
    winnerId: string,
    winnerName: string,
  ): Promise<void> {
    const nextMatch = await this.matchRepository.findOne({
      where: { id: nextMatchId },
    });

    if (!nextMatch) return;

    // Assign winner to next match slot
    if (!nextMatch.player1Id) {
      await this.matchRepository.update(nextMatchId, {
        player1Id: winnerId,
        player1Name: winnerName,
      });
    } else if (!nextMatch.player2Id) {
      await this.matchRepository.update(nextMatchId, {
        player2Id: winnerId,
        player2Name: winnerName,
        status: 'ready',
      });
    }
  }

  private async checkTournamentCompletion(tournamentId: string): Promise<void> {
    const tournament = await this.findOne(tournamentId);
    const matches = await this.matchRepository.find({
      where: { tournamentId },
    });

    const allMatchesCompleted = matches.every(
      (m: TournamentMatch) => m.status === 'completed',
    );

    if (allMatchesCompleted) {
      // Find final match (highest round number)
      const finalMatch = matches.reduce(
        (prev: TournamentMatch, current: TournamentMatch) =>
          current.roundNumber > prev.roundNumber ? current : prev,
      );

      await this.tournamentRepository.update(tournamentId, {
        status: 'completed',
        endTime: new Date(),
        winnerId: finalMatch.winnerId,
      });

      // Distribute prizes
      await this.distributePrizes(tournamentId);
    }
  }

  // Prize distribution
  private async distributePrizes(tournamentId: string): Promise<void> {
    this.logger.log(`Distributing prizes for tournament ${tournamentId}`);

    const tournament = await this.findOne(tournamentId);
    const participants = await this.participantRepository.find({
      where: { tournamentId },
      order: { wins: 'DESC', totalScore: 'DESC' },
    });

    const prizeDistribution = tournament.prizePool?.distribution || [];

    for (
      let i = 0;
      i < Math.min(participants.length, prizeDistribution.length);
      i++
    ) {
      const participant = participants[i];
      const prize = prizeDistribution[i];

      await this.participantRepository.update(participant.id, {
        finalPosition: i + 1,
        prizeAwarded: {
          amount: prize.amount,
          currency: tournament.prizePool.currency,
          badges: prize.badges,
          achievements: prize.achievements,
          awardedAt: new Date(),
        },
      });

      // Here you would typically call a service to credit the user's account
      // await this.userService.creditAccount(participant.userId, prize.amount, tournament.prizePool.currency);
    }
  }

  // Spectator mode
  async joinAsSpectator(
    tournamentId: string,
    userId: string,
    username: string,
    matchId?: string,
  ): Promise<TournamentSpectator> {
    const spectator = this.spectatorRepository.create({
      tournamentId,
      matchId,
      userId,
      username,
      joinedAt: new Date(),
      isActive: true,
      engagement: {},
      preferences: {},
    });

    return await this.spectatorRepository.save(spectator);
  }

  async leaveAsSpectator(spectatorId: string): Promise<void> {
    const spectator = await this.spectatorRepository.findOne({
      where: { id: spectatorId },
    });

    if (!spectator) return;

    const watchTime = Math.floor(
      (new Date().getTime() - new Date(spectator.joinedAt).getTime()) / 1000,
    );

    await this.spectatorRepository.update(spectatorId, {
      leftAt: new Date(),
      isActive: false,
      totalWatchTime: spectator.totalWatchTime + watchTime,
    });
  }

  async getTournamentSpectators(
    tournamentId: string,
  ): Promise<TournamentSpectator[]> {
    return await this.spectatorRepository.find({
      where: { tournamentId, isActive: true },
    });
  }

  // Get tournament bracket
  async getBracket(tournamentId: string): Promise<TournamentBracket> {
    const tournament = await this.findOne(tournamentId);
    const matches = await this.matchRepository.find({
      where: { tournamentId },
      order: { roundNumber: 'ASC', matchNumber: 'ASC' },
    });

    const rounds: BracketRound[] = [];
    const roundMap = new Map<number, BracketNode[]>();

    matches.forEach((match: TournamentMatch) => {
      if (!roundMap.has(match.roundNumber)) {
        roundMap.set(match.roundNumber, []);
      }

      roundMap.get(match.roundNumber)!.push({
        matchId: match.id,
        roundNumber: match.roundNumber,
        matchNumber: match.matchNumber,
        player1: match.player1Id
          ? { id: match.player1Id, name: match.player1Name! }
          : undefined,
        player2: match.player2Id
          ? { id: match.player2Id, name: match.player2Name! }
          : undefined,
        winner: match.winnerId
          ? { id: match.winnerId, name: match.winnerName! }
          : undefined,
        status: match.status as any,
        nextMatchId: match.nextMatchId,
        loserNextMatchId: match.loserNextMatchId,
      });
    });

    roundMap.forEach((matches, roundNumber) => {
      rounds.push({
        roundNumber,
        roundName:
          tournament.bracket.rounds?.find((r) => r.roundNumber === roundNumber)
            ?.roundName || `Round ${roundNumber}`,
        matches,
        isComplete: matches.every((m) => m.status === 'completed'),
      });
    });

    return {
      tournamentId,
      bracketType: tournament.bracketType,
      rounds,
      totalRounds: tournament.bracket.totalRounds || rounds.length,
      currentRound: tournament.bracket.currentRound || 1,
    };
  }

  // Get tournament standings
  async getStandings(tournamentId: string): Promise<any[]> {
    const participants = await this.participantRepository.find({
      where: { tournamentId },
      order: { wins: 'DESC', totalScore: 'DESC' },
    });

    return participants.map((p: TournamentParticipant, index: number) => ({
      position: index + 1,
      participantId: p.id,
      userId: p.userId,
      username: p.username,
      wins: p.wins,
      losses: p.losses,
      draws: p.draws,
      totalScore: p.totalScore,
      averageAccuracy: p.averageAccuracy,
      status: p.status,
    }));
  }

  // Tournament history and archives
  async getCompletedTournaments(limit: number = 10): Promise<Tournament[]> {
    return await this.tournamentRepository.find({
      where: { status: 'completed' },
      order: { endTime: 'DESC' },
      take: limit,
    });
  }

  async getTournamentHistory(tournamentId: string): Promise<any> {
    const tournament = await this.findOne(tournamentId);
    const participants = await this.participantRepository.find({
      where: { tournamentId },
    });
    const matches = await this.matchRepository.find({
      where: { tournamentId },
      order: { roundNumber: 'ASC', matchNumber: 'ASC' },
    });

    return {
      tournament,
      participants,
      matches,
      winner: participants.find(
        (p: TournamentParticipant) => p.finalPosition === 1,
      ),
      topPerformers: participants
        .sort(
          (a: TournamentParticipant, b: TournamentParticipant) =>
            b.totalScore - a.totalScore,
        )
        .slice(0, 10),
    };
  }
}
