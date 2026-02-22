import { Injectable, Logger, BadRequestException, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigType } from '@nestjs/config';
import { UserEnergy } from './entities/user-energy.entity';
import { EnergyTransaction, EnergyTransactionType } from './entities/energy-transaction.entity';
import { EnergyGift, EnergyGiftStatus } from './entities/energy-gift.entity';
import { EnergyBoost } from './entities/energy-boost.entity';
import { User } from '../users/entities/user.entity';
import { NotificationService } from '../notifications/notification.service';
import energyConfig from './config/energy.config';

export interface EnergyConsumptionResult {
  success: boolean;
  currentEnergy: number;
  maxEnergy: number;
  nextRegenerationAt: Date;
  message?: string;
}

export interface EnergyRefillResult {
  success: boolean;
  energyAdded: number;
  currentEnergy: number;
  maxEnergy: number;
  tokensUsed: number;
}

@Injectable()
export class EnergyService {
  private readonly logger = new Logger(EnergyService.name);

  constructor(
    @InjectRepository(UserEnergy)
    private userEnergyRepository: Repository<UserEnergy>,
    @InjectRepository(EnergyTransaction)
    private energyTransactionRepository: Repository<EnergyTransaction>,
    @InjectRepository(EnergyGift)
    private energyGiftRepository: Repository<EnergyGift>,
    @InjectRepository(EnergyBoost)
    private energyBoostRepository: Repository<EnergyBoost>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource,
    private notificationService: NotificationService,
    @Inject(energyConfig.KEY)
    private readonly config: ConfigType<typeof energyConfig>,
  ) {}

  async initializeUserEnergy(userId: string): Promise<UserEnergy> {
    const existingEnergy = await this.userEnergyRepository.findOne({
      where: { userId },
    });

    if (existingEnergy) {
      return existingEnergy;
    }

    const userEnergy = this.userEnergyRepository.create({
      userId,
      currentEnergy: this.config.defaultCurrentEnergy,
      maxEnergy: this.config.defaultMaxEnergy,
      lastRegeneration: new Date(),
      regenerationRate: this.config.defaultRegenerationRate,
      regenerationIntervalMinutes: this.config.defaultRegenerationIntervalMinutes,
    });

    return await this.userEnergyRepository.save(userEnergy);
  }

  async getUserEnergy(userId: string): Promise<UserEnergy> {
    let userEnergy = await this.userEnergyRepository.findOne({
      where: { userId },
    });

    if (!userEnergy) {
      userEnergy = await this.initializeUserEnergy(userId);
    }

    // Update energy based on time passed
    await this.regenerateEnergy(userEnergy);
    
    return await this.userEnergyRepository.findOne({
      where: { userId },
    });
  }

  async consumeEnergy(
    userId: string,
    amount: number,
    relatedEntityId?: string,
    relatedEntityType?: string,
    metadata?: Record<string, any>
  ): Promise<EnergyConsumptionResult> {
    const userEnergy = await this.getUserEnergy(userId);

    if (userEnergy.currentEnergy < amount) {
      return {
        success: false,
        currentEnergy: userEnergy.currentEnergy,
        maxEnergy: userEnergy.maxEnergy,
        nextRegenerationAt: this.calculateNextRegenerationTime(userEnergy),
        message: 'Insufficient energy',
      };
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const energyBefore = userEnergy.currentEnergy;
      userEnergy.currentEnergy -= amount;
      
      await queryRunner.manager.save(userEnergy);

      // Record transaction
      const transaction = this.energyTransactionRepository.create({
        userId,
        transactionType: EnergyTransactionType.CONSUMPTION,
        amount: -amount,
        energyBefore,
        energyAfter: userEnergy.currentEnergy,
        relatedEntityId,
        relatedEntityType,
        metadata,
      });

      await queryRunner.manager.save(transaction);
      await queryRunner.commitTransaction();

      this.logger.log(`Energy consumed: ${amount} for user ${userId}`);

      return {
        success: true,
        currentEnergy: userEnergy.currentEnergy,
        maxEnergy: userEnergy.maxEnergy,
        nextRegenerationAt: this.calculateNextRegenerationTime(userEnergy),
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to consume energy for user ${userId}:`, error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async regenerateEnergy(userEnergy: UserEnergy): Promise<void> {
    const now = new Date();
    const timeSinceLastRegen = now.getTime() - userEnergy.lastRegeneration.getTime();
    const intervalMs = userEnergy.regenerationIntervalMinutes * 60 * 1000;
    
    if (timeSinceLastRegen < intervalMs || userEnergy.currentEnergy >= userEnergy.maxEnergy) {
      return;
    }

    const intervalsToRegenerate = Math.floor(timeSinceLastRegen / intervalMs);
    const energyToAdd = Math.min(
      intervalsToRegenerate * userEnergy.regenerationRate * userEnergy.boostMultiplier,
      userEnergy.maxEnergy - userEnergy.currentEnergy
    );

    if (energyToAdd > 0) {
      const energyBefore = userEnergy.currentEnergy;
      userEnergy.currentEnergy += energyToAdd;
      userEnergy.lastRegeneration = new Date(
        userEnergy.lastRegeneration.getTime() + (intervalsToRegenerate * intervalMs)
      );

      await this.userEnergyRepository.save(userEnergy);

      // Record transaction
      const transaction = this.energyTransactionRepository.create({
        userId: userEnergy.userId,
        transactionType: EnergyTransactionType.REGENERATION,
        amount: energyToAdd,
        energyBefore,
        energyAfter: userEnergy.currentEnergy,
        metadata: { intervalsRegenerated: intervalsToRegenerate },
      });

      await this.energyTransactionRepository.save(transaction);

      // Send notification if energy is full
      if (userEnergy.currentEnergy >= userEnergy.maxEnergy) {
        await this.notificationService.createNotificationForUsers({
          userIds: [userEnergy.userId],
          type: 'energy_full',
          title: 'Energy Full!',
          body: 'Your energy is fully restored. Ready for more puzzles?',
          meta: { type: 'energy_full' }
        });
      }

      this.logger.log(`Energy regenerated: ${energyToAdd} for user ${userEnergy.userId}`);
    }
  }

  private calculateNextRegenerationTime(userEnergy: UserEnergy): Date {
    const intervalMs = userEnergy.regenerationIntervalMinutes * 60 * 1000;
    return new Date(userEnergy.lastRegeneration.getTime() + intervalMs);
  }

  async refillEnergyWithTokens(
    userId: string,
    tokensToSpend: number
  ): Promise<EnergyRefillResult> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // TODO: Integrate with actual token/wallet system
    // For now, assume 1 token = 10 energy, max 50 energy per refill
    const energyPerToken = 10;
    const maxEnergyPerRefill = 50;
    const energyToAdd = Math.min(tokensToSpend * energyPerToken, maxEnergyPerRefill);

    const userEnergy = await this.getUserEnergy(userId);
    const maxPossibleEnergy = userEnergy.maxEnergy - userEnergy.currentEnergy;
    const actualEnergyToAdd = Math.min(energyToAdd, maxPossibleEnergy);
    const actualTokensUsed = Math.ceil(actualEnergyToAdd / energyPerToken);

    if (actualEnergyToAdd <= 0) {
      return {
        success: false,
        energyAdded: 0,
        currentEnergy: userEnergy.currentEnergy,
        maxEnergy: userEnergy.maxEnergy,
        tokensUsed: 0,
      };
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const energyBefore = userEnergy.currentEnergy;
      userEnergy.currentEnergy += actualEnergyToAdd;
      
      await queryRunner.manager.save(userEnergy);

      // Record transaction
      const transaction = this.energyTransactionRepository.create({
        userId,
        transactionType: EnergyTransactionType.TOKEN_REFILL,
        amount: actualEnergyToAdd,
        energyBefore,
        energyAfter: userEnergy.currentEnergy,
        metadata: { tokensUsed: actualTokensUsed },
      });

      await queryRunner.manager.save(transaction);
      await queryRunner.commitTransaction();

      this.logger.log(`Energy refilled: ${actualEnergyToAdd} for user ${userId} using ${actualTokensUsed} tokens`);

      return {
        success: true,
        energyAdded: actualEnergyToAdd,
        currentEnergy: userEnergy.currentEnergy,
        maxEnergy: userEnergy.maxEnergy,
        tokensUsed: actualTokensUsed,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to refill energy for user ${userId}:`, error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // Cron job to regenerate energy every 5 minutes
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleEnergyRegeneration() {
    this.logger.log('Running energy regeneration cron job');
    
    const userEnergies = await this.userEnergyRepository
      .createQueryBuilder('ue')
      .where('ue.current_energy < ue.max_energy')
      .getMany();

    for (const userEnergy of userEnergies) {
      try {
        await this.regenerateEnergy(userEnergy);
      } catch (error) {
        this.logger.error(`Failed to regenerate energy for user ${userEnergy.userId}:`, error);
      }
    }
  }

  // Cron job to clean up expired gifts daily
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupExpiredGifts() {
    this.logger.log('Cleaning up expired energy gifts');
    
    await this.energyGiftRepository
      .createQueryBuilder()
      .update()
      .set({ status: EnergyGiftStatus.EXPIRED })
      .where('status = :status AND expires_at < :now', {
        status: EnergyGiftStatus.PENDING,
        now: new Date(),
      })
      .execute();
  }

  async sendEnergyGift(
    senderId: string,
    recipientId: string,
    energyAmount: number = 10,
    message?: string
  ): Promise<EnergyGift> {
    if (senderId === recipientId) {
      throw new BadRequestException('Cannot send energy gift to yourself');
    }

    const senderEnergy = await this.getUserEnergy(senderId);
    const recipient = await this.userRepository.findOne({ where: { id: recipientId } });
    
    if (!recipient) {
      throw new NotFoundException('Recipient not found');
    }

    // Reset daily gift counters if needed
    await this.resetDailyGiftCounters(senderEnergy);

    // Check daily gift limits (max 5 gifts per day)
    if (senderEnergy.energyGiftsSentToday >= 5) {
      throw new BadRequestException('Daily gift limit reached');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create gift
      const gift = this.energyGiftRepository.create({
        senderId,
        recipientId,
        energyAmount,
        message,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      });

      await queryRunner.manager.save(gift);

      // Update sender's daily gift count
      senderEnergy.energyGiftsSentToday += 1;
      await queryRunner.manager.save(senderEnergy);

      // Record transaction for sender
      const senderTransaction = this.energyTransactionRepository.create({
        userId: senderId,
        transactionType: EnergyTransactionType.GIFT_SENT,
        amount: 0, // No energy cost for sending
        energyBefore: senderEnergy.currentEnergy,
        energyAfter: senderEnergy.currentEnergy,
        relatedEntityId: gift.id,
        relatedEntityType: 'gift',
        metadata: { recipientId, energyAmount },
      });

      await queryRunner.manager.save(senderTransaction);
      await queryRunner.commitTransaction();

      // Send notification to recipient
      await this.notificationService.createNotificationForUsers({
        userIds: [recipientId],
        type: 'energy_gift',
        title: 'Energy Gift Received!',
        body: `You received ${energyAmount} energy from a friend!`,
        meta: { type: 'energy_gift', giftId: gift.id }
      });

      this.logger.log(`Energy gift sent: ${energyAmount} from ${senderId} to ${recipientId}`);
      return gift;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to send energy gift:`, error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async acceptEnergyGift(userId: string, giftId: string): Promise<EnergyGift> {
    const gift = await this.energyGiftRepository.findOne({
      where: { id: giftId, recipientId: userId, status: EnergyGiftStatus.PENDING },
    });

    if (!gift) {
      throw new NotFoundException('Gift not found or already processed');
    }

    if (gift.expiresAt < new Date()) {
      gift.status = EnergyGiftStatus.EXPIRED;
      await this.energyGiftRepository.save(gift);
      throw new BadRequestException('Gift has expired');
    }

    const userEnergy = await this.getUserEnergy(userId);
    
    // Reset daily gift counters if needed
    await this.resetDailyGiftCounters(userEnergy);

    // Check daily receive limit (max 10 gifts per day)
    if (userEnergy.energyGiftsReceivedToday >= 10) {
      throw new BadRequestException('Daily gift receive limit reached');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const energyBefore = userEnergy.currentEnergy;
      const energyToAdd = Math.min(gift.energyAmount, userEnergy.maxEnergy - userEnergy.currentEnergy);
      
      userEnergy.currentEnergy += energyToAdd;
      userEnergy.energyGiftsReceivedToday += 1;
      
      gift.status = EnergyGiftStatus.ACCEPTED;
      gift.acceptedAt = new Date();

      await queryRunner.manager.save([userEnergy, gift]);

      // Record transaction
      const transaction = this.energyTransactionRepository.create({
        userId,
        transactionType: EnergyTransactionType.GIFT_RECEIVED,
        amount: energyToAdd,
        energyBefore,
        energyAfter: userEnergy.currentEnergy,
        relatedEntityId: gift.id,
        relatedEntityType: 'gift',
        metadata: { senderId: gift.senderId, originalAmount: gift.energyAmount },
      });

      await queryRunner.manager.save(transaction);
      await queryRunner.commitTransaction();

      this.logger.log(`Energy gift accepted: ${energyToAdd} by user ${userId}`);
      return gift;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to accept energy gift:`, error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getPendingGifts(userId: string): Promise<EnergyGift[]> {
    return await this.energyGiftRepository.find({
      where: { 
        recipientId: userId, 
        status: EnergyGiftStatus.PENDING,
      },
      relations: ['sender'],
      order: { createdAt: 'DESC' },
    });
  }

  private async resetDailyGiftCounters(userEnergy: UserEnergy): Promise<void> {
    const today = new Date().toDateString();
    const lastReset = userEnergy.lastGiftReset.toDateString();

    if (today !== lastReset) {
      userEnergy.energyGiftsSentToday = 0;
      userEnergy.energyGiftsReceivedToday = 0;
      userEnergy.lastGiftReset = new Date();
      await this.userEnergyRepository.save(userEnergy);
    }
  }

  async applyEnergyBoost(
    userId: string,
    boostId: string
  ): Promise<UserEnergy> {
    const boost = await this.energyBoostRepository.findOne({
      where: { id: boostId, isActive: true },
    });

    if (!boost) {
      throw new NotFoundException('Boost not found or inactive');
    }

    const userEnergy = await this.getUserEnergy(userId);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const energyBefore = userEnergy.currentEnergy;
      let energyAfter = energyBefore;

      switch (boost.boostType) {
        case 'regeneration_speed':
          userEnergy.boostMultiplier = boost.effectValue;
          userEnergy.boostExpiresAt = boost.durationMinutes 
            ? new Date(Date.now() + boost.durationMinutes * 60 * 1000)
            : null;
          break;

        case 'max_energy_increase':
          userEnergy.maxEnergy += boost.effectValue;
          break;

        case 'instant_refill':
          const refillAmount = Math.min(boost.effectValue, userEnergy.maxEnergy - userEnergy.currentEnergy);
          userEnergy.currentEnergy += refillAmount;
          energyAfter = userEnergy.currentEnergy;
          break;

        case 'consumption_reduction':
          // This would be handled in the consumption logic
          userEnergy.boostMultiplier = boost.effectValue;
          userEnergy.boostExpiresAt = boost.durationMinutes 
            ? new Date(Date.now() + boost.durationMinutes * 60 * 1000)
            : null;
          break;
      }

      await queryRunner.manager.save(userEnergy);

      // Record transaction
      const transaction = this.energyTransactionRepository.create({
        userId,
        transactionType: EnergyTransactionType.BOOST_APPLIED,
        amount: energyAfter - energyBefore,
        energyBefore,
        energyAfter,
        relatedEntityId: boost.id,
        relatedEntityType: 'boost',
        metadata: { 
          boostType: boost.boostType,
          effectValue: boost.effectValue,
          durationMinutes: boost.durationMinutes,
        },
      });

      await queryRunner.manager.save(transaction);
      await queryRunner.commitTransaction();

      this.logger.log(`Energy boost applied: ${boost.name} for user ${userId}`);
      return userEnergy;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to apply energy boost:`, error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getEnergyHistory(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<EnergyTransaction[]> {
    return await this.energyTransactionRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  async getEnergyStats(userId: string): Promise<{
    currentEnergy: number;
    maxEnergy: number;
    nextRegenerationAt: Date;
    giftsSentToday: number;
    giftsReceivedToday: number;
    pendingGifts: number;
    boostActive: boolean;
    boostExpiresAt: Date | null;
  }> {
    const userEnergy = await this.getUserEnergy(userId);
    const pendingGiftsCount = await this.energyGiftRepository.count({
      where: { recipientId: userId, status: EnergyGiftStatus.PENDING },
    });

    return {
      currentEnergy: userEnergy.currentEnergy,
      maxEnergy: userEnergy.maxEnergy,
      nextRegenerationAt: this.calculateNextRegenerationTime(userEnergy),
      giftsSentToday: userEnergy.energyGiftsSentToday,
      giftsReceivedToday: userEnergy.energyGiftsReceivedToday,
      pendingGifts: pendingGiftsCount,
      boostActive: userEnergy.boostExpiresAt ? userEnergy.boostExpiresAt > new Date() : false,
      boostExpiresAt: userEnergy.boostExpiresAt,
    };
  }
}