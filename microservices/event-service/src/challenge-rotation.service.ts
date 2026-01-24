import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Challenge } from './challenge.entity';

@Injectable()
export class ChallengeRotationService {
  private readonly logger = new Logger(ChallengeRotationService.name);

  constructor(
    @InjectRepository(Challenge)
    private readonly challengeRepository: Repository<Challenge>,
  ) {}

  // Runs every day at midnight
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async rotateChallenges() {
    this.logger.log('Rotating challenges...');
    // Example: rotate by updating rotationTime to now for the next challenge
    const nextChallenge = await this.challengeRepository.findOne({
      order: { rotationTime: 'ASC' },
    });
    if (nextChallenge) {
      nextChallenge.rotationTime = new Date();
      await this.challengeRepository.save(nextChallenge);
      this.logger.log(`Rotated challenge: ${nextChallenge.name}`);
    }
  }
}
