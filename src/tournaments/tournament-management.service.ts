import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';

export type TournamentStatus = 'pending' | 'active' | 'completed' | 'cancelled';

export interface Tournament {
  id: string;
  name: string;
  status: TournamentStatus;
  maxParticipants: number;
  participants: string[];
  startAt: Date;
  createdAt: Date;
}

@Injectable()
export class TournamentManagementService {
  private readonly logger = new Logger(TournamentManagementService.name);
  private readonly tournaments = new Map<string, Tournament>();
  private counter = 1;

  create(name: string, maxParticipants: number, startAt: Date): Tournament {
    const id = `tournament-${this.counter++}`;
    const tournament: Tournament = {
      id,
      name,
      status: 'pending',
      maxParticipants,
      participants: [],
      startAt,
      createdAt: new Date(),
    };
    this.tournaments.set(id, tournament);
    this.logger.log(`Tournament created: ${id} — "${name}"`);
    return tournament;
  }

  join(tournamentId: string, userId: string): Tournament {
    const tournament = this.findOrThrow(tournamentId);

    if (tournament.status !== 'pending') {
      throw new BadRequestException(`Tournament "${tournamentId}" is not open for registration.`);
    }
    if (tournament.participants.includes(userId)) {
      throw new BadRequestException(`User ${userId} is already registered.`);
    }
    if (tournament.participants.length >= tournament.maxParticipants) {
      throw new BadRequestException(`Tournament "${tournamentId}" is full.`);
    }

    tournament.participants.push(userId);
    return tournament;
  }

  start(tournamentId: string): Tournament {
    const tournament = this.findOrThrow(tournamentId);
    if (tournament.status !== 'pending') {
      throw new BadRequestException(`Only pending tournaments can be started.`);
    }
    tournament.status = 'active';
    this.logger.log(`Tournament started: ${tournamentId}`);
    return tournament;
  }

  complete(tournamentId: string): Tournament {
    const tournament = this.findOrThrow(tournamentId);
    if (tournament.status !== 'active') {
      throw new BadRequestException(`Only active tournaments can be completed.`);
    }
    tournament.status = 'completed';
    this.logger.log(`Tournament completed: ${tournamentId}`);
    return tournament;
  }

  findById(id: string): Tournament | undefined {
    return this.tournaments.get(id);
  }

  private findOrThrow(id: string): Tournament {
    const t = this.tournaments.get(id);
    if (!t) throw new NotFoundException(`Tournament "${id}" not found.`);
    return t;
  }
}
