import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tournament } from './tournament.entity';

@Injectable()
export class RewardDistributionService {
  private readonly logger = new Logger(RewardDistributionService.name);

  constructor(
    @InjectRepository(Tournament)
    private readonly tournamentRepository: Repository<Tournament>,
  ) {}

  // Runs every day at 1am
  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async distributeRewards() {
    this.logger.log('Distributing rewards for finished tournaments...');
    // Example: Find tournaments that ended and distribute rewards
    const now = new Date();
    const finishedTournaments = await this.tournamentRepository.find({
      where: {
        /* Add logic to filter finished tournaments */
      },
    });
    for (const tournament of finishedTournaments) {
      // Placeholder: distribute rewards to winners
      this.logger.log(`Rewards distributed for tournament: ${tournament.name}`);
    }
  }
}
