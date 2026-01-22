import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThanOrEqual } from 'typeorm';
import { UserEnergy } from './entities/energy.entity';
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';

@Injectable()
export class EnergyNotificationService {
  private readonly logger = new Logger(EnergyNotificationService.name);
  private client: ClientProxy;

  constructor(
    @InjectRepository(UserEnergy)
    private readonly energyRepository: Repository<UserEnergy>,
  ) {
    this.client = ClientProxyFactory.create({
      transport: Transport.TCP,
      options: {
        host: 'notification-service',
        port: 8888,
      },
    });
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async checkFullEnergy() {
    this.logger.log('Checking for users with full energy...');
    
    // This is a bit tricky with lazy regen. In a real system, we might:
    // 1. Only notify if they WEREN'T full last time we checked.
    // 2. Use a "nextFullAt" field to query more efficiently.
    
    const usersToNotify = await this.energyRepository.find({
      where: {
        currentEnergy: LessThan(100), // Assuming max energy is 100 for now, should use maxEnergy field
        // We'd need a more complex query or pre-calculate nextFullAt
      },
    });

    const now = new Date();
    for (const energy of usersToNotify) {
      const secondsNeeded = (energy.maxEnergy - energy.currentEnergy) * energy.regenerationRate;
      const fullAt = new Date(energy.lastRegenerationAt.getTime() + secondsNeeded * 1000);

      if (fullAt <= now) {
        this.logger.log(`Notifying user ${energy.userId} that energy is full`);
        this.client.emit('energy_full', { userId: energy.userId, message: 'Your energy is fully restored!' });
        
        // Update energy to max so we don't notify again until they consume
        energy.currentEnergy = energy.maxEnergy;
        energy.lastRegenerationAt = now;
        await this.energyRepository.save(energy);
      }
    }
  }
}
