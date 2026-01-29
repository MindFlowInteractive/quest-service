import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { ReferralCode } from './entities/referral-code.entity';
import { Referral, ReferralStatus } from './entities/referral.entity';
import { User } from '../users/entities/user.entity';
import { CreateReferralCodeDto } from './dto/create-referral-code.dto';
import { UseReferralCodeDto } from './dto/use-referral-code.dto';

@Injectable()
export class ReferralsService {
  private readonly logger = new Logger(ReferralsService.name);
  private readonly baseUrl: string;

  // Default reward amounts (can be configured via environment variables)
  private readonly REFERRER_REWARD = 100; // Points for referrer
  private readonly REFEREE_REWARD = 50; // Points for referee

  constructor(
    @InjectRepository(ReferralCode)
    private readonly referralCodeRepository: Repository<ReferralCode>,
    @InjectRepository(Referral)
    private readonly referralRepository: Repository<Referral>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {
    // Get base URL from config or environment
    this.baseUrl =
      this.configService.get<string>('APP_BASE_URL') ||
      this.configService.get<string>('app.cors.origin') ||
      'http://localhost:3000';
  }

  /**
   * Generate a unique referral code for a user
   */
  async generateReferralCode(
    userId: string,
    createDto?: CreateReferralCodeDto,
  ): Promise<ReferralCode> {
    // Check if user exists
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Check if user already has a referral code
    const existingCode = await this.referralCodeRepository.findOne({
      where: { userId },
    });

    if (existingCode) {
      return existingCode;
    }

    // Generate unique code
    const code = await this.generateUniqueCode();

    // Create referral code
    const referralCode = this.referralCodeRepository.create({
      code,
      userId,
      isActive: createDto?.isActive ?? true,
      expiresAt: createDto?.expiresAt
        ? new Date(createDto.expiresAt)
        : undefined,
    });

    const saved = await this.referralCodeRepository.save(referralCode);

    // Update user metadata with referral code
    if (!user.metadata) {
      user.metadata = {};
    }
    user.metadata.referralCode = code;
    await this.userRepository.save(user);

    this.logger.log(`Generated referral code ${code} for user ${userId}`);
    return saved;
  }

  /**
   * Generate a unique referral code
   */
  private async generateUniqueCode(): Promise<string> {
    const maxAttempts = 10;
    let attempts = 0;

    while (attempts < maxAttempts) {
      // Generate a code: 6-8 alphanumeric characters, uppercase
      const code = this.generateRandomCode();
      const exists = await this.referralCodeRepository.findOne({
        where: { code },
      });

      if (!exists) {
        return code;
      }

      attempts++;
    }

    throw new Error('Failed to generate unique referral code');
  }

  /**
   * Generate a random alphanumeric code
   */
  private generateRandomCode(length: number = 8): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Get referral code for a user
   */
  async getReferralCode(userId: string): Promise<ReferralCode> {
    const code = await this.referralCodeRepository.findOne({
      where: { userId },
      relations: ['user'],
    });

    if (!code) {
      // Auto-generate if doesn't exist
      return this.generateReferralCode(userId);
    }

    return code;
  }

  /**
   * Generate invite link for a referral code
   */
  async generateInviteLink(userId: string): Promise<string> {
    const referralCode = await this.getReferralCode(userId);

    if (!referralCode.isActive) {
      throw new BadRequestException('Referral code is not active');
    }

    if (referralCode.expiresAt && referralCode.expiresAt < new Date()) {
      throw new BadRequestException('Referral code has expired');
    }

    // Generate invite link
    const inviteLink = `${this.baseUrl}/signup?ref=${referralCode.code}`;
    return inviteLink;
  }

  /**
   * Use a referral code (when a new user signs up)
   */
  async useReferralCode(
    refereeId: string,
    useDto: UseReferralCodeDto,
    metadata?: { registrationIp?: string; userAgent?: string },
  ): Promise<Referral> {
    // Check if referee exists
    const referee = await this.userRepository.findOne({
      where: { id: refereeId },
    });
    if (!referee) {
      throw new NotFoundException(`User with ID ${refereeId} not found`);
    }

    // Find referral code
    const referralCode = await this.referralCodeRepository.findOne({
      where: { code: useDto.code },
      relations: ['user'],
    });

    if (!referralCode) {
      throw new NotFoundException(`Referral code ${useDto.code} not found`);
    }

    if (!referralCode.isActive) {
      throw new BadRequestException('Referral code is not active');
    }

    if (referralCode.expiresAt && referralCode.expiresAt < new Date()) {
      throw new BadRequestException('Referral code has expired');
    }

    // Check if user is trying to refer themselves
    if (referralCode.userId === refereeId) {
      throw new BadRequestException('Cannot use your own referral code');
    }

    // Check if referral already exists
    const existingReferral = await this.referralRepository.findOne({
      where: {
        referrerId: referralCode.userId,
        refereeId,
      },
    });

    if (existingReferral) {
      throw new BadRequestException('Referral already exists');
    }

    // Create referral record
    const referral = this.referralRepository.create({
      referrerId: referralCode.userId,
      refereeId,
      referralCodeId: referralCode.id,
      status: ReferralStatus.PENDING,
      referrerReward: this.REFERRER_REWARD,
      refereeReward: this.REFEREE_REWARD,
      metadata: {
        registrationIp: metadata?.registrationIp,
        userAgent: metadata?.userAgent,
        source: useDto.source,
        campaign: useDto.campaign,
      },
    });

    const saved = await this.referralRepository.save(referral);

    // Update referral code stats
    referralCode.totalReferrals += 1;
    referralCode.activeReferrals += 1;
    await this.referralCodeRepository.save(referralCode);

    // Update user metadata
    if (!referee.metadata) {
      referee.metadata = {};
    }
    referee.metadata.referredBy = referralCode.userId;
    await this.userRepository.save(referee);

    this.logger.log(
      `Referral created: ${referralCode.userId} -> ${refereeId} (code: ${useDto.code})`,
    );

    return saved;
  }

  /**
   * Complete a referral (when referee completes required actions)
   */
  async completeReferral(referralId: string): Promise<Referral> {
    const referral = await this.referralRepository.findOne({
      where: { id: referralId },
      relations: ['referrer', 'referee', 'referralCode'],
    });

    if (!referral) {
      throw new NotFoundException(`Referral with ID ${referralId} not found`);
    }

    if (referral.status === ReferralStatus.COMPLETED) {
      return referral;
    }

    // Update status
    referral.status = ReferralStatus.COMPLETED;
    referral.completedAt = new Date();
    await this.referralRepository.save(referral);

    // Distribute rewards
    await this.distributeRewards(referral);

    this.logger.log(`Referral ${referralId} completed and rewards distributed`);

    return referral;
  }

  /**
   * Distribute rewards to referrer and referee
   */
  private async distributeRewards(referral: Referral): Promise<void> {
    try {
      // Distribute referrer reward
      if (!referral.referrerRewarded && referral.referrerReward > 0) {
        await this.grantReward(
          referral.referrerId,
          referral.referrerReward,
          'referral_referrer',
          referral.id,
        );
        referral.referrerRewarded = true;
        referral.referrerRewardedAt = new Date();

        // Update referral code stats
        const referralCode = await this.referralCodeRepository.findOne({
          where: { id: referral.referralCodeId },
        });
        if (referralCode) {
          referralCode.totalRewardsEarned += referral.referrerReward;
          await this.referralCodeRepository.save(referralCode);
        }
      }

      // Distribute referee reward
      if (!referral.refereeRewarded && referral.refereeReward > 0) {
        await this.grantReward(
          referral.refereeId,
          referral.refereeReward,
          'referral_referee',
          referral.id,
        );
        referral.refereeRewarded = true;
        referral.refereeRewardedAt = new Date();
      }

      await this.referralRepository.save(referral);
    } catch (error) {
      this.logger.error(
        `Failed to distribute rewards for referral ${referral.id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Grant reward to a user
   * TODO: Integrate with economy-service when available
   */
  private async grantReward(
    userId: string,
    amount: number,
    type: string,
    referralId: string,
  ): Promise<void> {
    // For now, update user's experience/score
    // In production, this should call economy-service
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (user) {
      user.experience += amount;
      user.totalScore += amount;
      await this.userRepository.save(user);
    }

    this.logger.log(
      `Granted ${amount} points to user ${userId} (type: ${type}, referral: ${referralId})`,
    );
  }

  /**
   * Get referrals for a user (as referrer)
   */
  async getReferralsByReferrer(
    userId: string,
    status?: ReferralStatus,
  ): Promise<Referral[]> {
    const where: any = { referrerId: userId };
    if (status) {
      where.status = status;
    }

    return this.referralRepository.find({
      where,
      relations: ['referee', 'referralCode'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get referral stats for a user
   */
  async getReferralStats(userId: string) {
    const referralCode = await this.referralCodeRepository.findOne({
      where: { userId },
    });

    if (!referralCode) {
      return {
        totalReferrals: 0,
        activeReferrals: 0,
        completedReferrals: 0,
        totalRewardsEarned: 0,
        hasCode: false,
      };
    }

    const [total, completed] = await Promise.all([
      this.referralRepository.count({
        where: { referrerId: userId },
      }),
      this.referralRepository.count({
        where: {
          referrerId: userId,
          status: ReferralStatus.COMPLETED,
        },
      }),
    ]);

    return {
      totalReferrals: total,
      activeReferrals: referralCode.activeReferrals,
      completedReferrals: completed,
      totalRewardsEarned: referralCode.totalRewardsEarned,
      hasCode: true,
      code: referralCode.code,
      inviteLink: await this.generateInviteLink(userId),
    };
  }

  /**
   * Get referral by ID
   */
  async getReferralById(referralId: string): Promise<Referral> {
    const referral = await this.referralRepository.findOne({
      where: { id: referralId },
      relations: ['referrer', 'referee', 'referralCode'],
    });

    if (!referral) {
      throw new NotFoundException(`Referral with ID ${referralId} not found`);
    }

    return referral;
  }
}
