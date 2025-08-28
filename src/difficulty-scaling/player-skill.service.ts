import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserStats } from '../users/entities/user-stats.entity';
import { calculatePlayerSkill } from './player-skill-algorithm';

@Injectable()
export class PlayerSkillService {
  constructor(
    @InjectRepository(UserStats)
    private readonly userStatsRepository: Repository<UserStats>,
  ) {}

  /**
   * Returns a skill score from 1 (easy) to 5 (hard) for the player.
   */
  async getPlayerSkill(playerId: string): Promise<number> {
    const stats = await this.userStatsRepository.findOne({ where: { userId: playerId } });
    return calculatePlayerSkill(stats);
  }
}
