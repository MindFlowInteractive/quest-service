import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tournament } from './tournament.entity';

import {
  TournamentBracketGenerator,
  BracketType,
  BracketResult,
  isBracketError,
} from './tournament-bracket.generator';

@Injectable()
export class TournamentService {
  constructor(
    @InjectRepository(Tournament)
    private readonly tournamentRepository: Repository<Tournament>,
  ) {}

  async generateBracket(
    tournamentId: number,
    players: string[],
    type: BracketType = 'single-elimination',
  ): Promise<BracketResult> {
    const bracket = TournamentBracketGenerator.generate(players, type);
    if (!isBracketError(bracket)) {
      const tournament = await this.tournamentRepository.findOneBy({
        id: tournamentId,
      });
      if (!tournament) {
        throw new Error('Tournament not found');
      }
      tournament.bracket = bracket;
      await this.tournamentRepository.save(tournament);
    }
    return bracket;
  }
}
