import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { UserEnergy, EnergyType } from './energy.entity';

@Injectable()
export class EnergyRegenerationService {
  private readonly logger = new Logger(EnergyRegenerationService.name);

  constructor(
    @InjectRepository(UserEnergy)
    private readonly energyRepository: Repository<UserEnergy>,
  ) {}

  @Cron('*/30 * * * * *')
  async regenerateEnergy(): Promise<void> {
    try {
      const now = new Date();
      const thirtySecondsAgo = new Date(now.getTime() - 30 * 1000);

      const usersNeedingRegeneration = await this.energyRepository.find({
        where: {
          currentAmount: LessThan(999),
          lastRegenerationTime: LessThan(thirtySecondsAgo),
        },
      });

      for (const userEnergy of usersNeedingRegeneration) {
        await this.regenerateUserEnergy(userEnergy);
      }

      if (usersNeedingRegeneration.length > 0) {
        this.logger.log(
          `Regenerated energy for ${usersNeedingRegeneration.length} users`,
        );
      }
    } catch (error) {
      this.logger.error('Error during energy regeneration:', error);
    }
  }

  async regenerateUserEnergy(userEnergy: UserEnergy): Promise<UserEnergy> {
    const now = new Date();
    const timeDiffInSeconds = Math.floor(
      (now.getTime() - userEnergy.lastRegenerationTime.getTime()) / 1000,
    );

    if (timeDiffInSeconds >= userEnergy.regenerationInterval) {
      const intervalsPassed = Math.floor(
        timeDiffInSeconds / userEnergy.regenerationInterval,
      );
      const energyToRegenerate = intervalsPassed * userEnergy.regenerationRate;

      userEnergy.currentAmount = Math.min(
        userEnergy.currentAmount + energyToRegenerate,
        userEnergy.maxAmount,
      );

      userEnergy.lastRegenerationTime = new Date(
        userEnergy.lastRegenerationTime.getTime() +
          intervalsPassed * userEnergy.regenerationInterval * 1000,
      );

      return this.energyRepository.save(userEnergy);
    }

    return userEnergy;
  }

  async getEnergyRegenerationStatus(
    userId: string,
    energyType: EnergyType = EnergyType.ENERGY,
  ): Promise<{
    currentAmount: number;
    maxAmount: number;
    timeToNextRegeneration: number;
    regenerationRate: number;
  }> {
    const userEnergy = await this.energyRepository.findOne({
      where: { userId, energyType },
    });

    if (!userEnergy) {
      throw new Error('User energy not found');
    }

    const now = new Date();
    const timeSinceLastRegeneration = Math.floor(
      (now.getTime() - userEnergy.lastRegenerationTime.getTime()) / 1000,
    );

    const timeToNextRegeneration = Math.max(
      0,
      userEnergy.regenerationInterval - timeSinceLastRegeneration,
    );

    return {
      currentAmount: userEnergy.currentAmount,
      maxAmount: userEnergy.maxAmount,
      timeToNextRegeneration,
      regenerationRate: userEnergy.regenerationRate,
    };
  }
}
