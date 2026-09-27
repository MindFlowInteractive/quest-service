import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import {
  AccountReset,
  ResetType,
  ResetStatus,
  AccountAuditAction,
} from './entities/account-reset.entity';
import { AccountAuditTrail } from './entities/account-audit-trail.entity';
import { RequestResetDto, ConfirmResetDto, LinkAccountDto } from './dto/account-management.dto';
import { User } from '../users/entities/user.entity';

/** Delay (in ms) between a reset request and when it may be confirmed */
const RESET_CONFIRMATION_DELAY_MS = 5 * 60 * 1_000; // 5 minutes

@Injectable()
export class AccountManagementService {
  private readonly logger = new Logger(AccountManagementService.name);

  constructor(
    @InjectRepository(AccountReset)
    private readonly resetRepository: Repository<AccountReset>,
    @InjectRepository(AccountAuditTrail)
    private readonly auditRepository: Repository<AccountAuditTrail>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // ─── Progression Reset ────────────────────────────────────────────────────

  /**
   * Initiate a progression reset. Creates a backup snapshot and issues a
   * confirmation token.  Actual reset is applied only after confirmation.
   */
  async requestReset(
    userId: string,
    dto: RequestResetDto,
    ipAddress?: string,
  ): Promise<AccountReset> {
    // Prevent duplicate pending resets
    const existing = await this.resetRepository.findOne({
      where: { userId, status: ResetStatus.PENDING },
    });
    if (existing) {
      throw new BadRequestException(
        'A reset request is already pending. Confirm or cancel it first.',
      );
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User ${userId} not found`);

    // Backup current progression state (stub — extend per app schema)
    const backupSnapshot = await this.buildBackupSnapshot(userId);

    const confirmationToken = crypto.randomBytes(32).toString('hex');

    const reset = this.resetRepository.create({
      userId,
      resetType: dto.resetType,
      status: ResetStatus.PENDING,
      confirmationToken,
      backupSnapshot,
      reason: dto.reason,
      ipAddress,
    });

    const saved = await this.resetRepository.save(reset);

    await this.writeAudit(userId, AccountAuditAction.RESET_REQUESTED, {
      resetId: saved.id,
      resetType: dto.resetType,
      backupCreated: true,
    }, ipAddress);

    this.logger.log(`Reset requested by user ${userId} (type: ${dto.resetType})`);
    return saved;
  }

  /**
   * Confirm a pending reset using the token.
   * A minimum delay prevents accidental confirmations.
   */
  async confirmReset(userId: string, dto: ConfirmResetDto): Promise<AccountReset> {
    const reset = await this.resetRepository.findOne({
      where: { userId, status: ResetStatus.PENDING },
    });

    if (!reset) {
      throw new NotFoundException('No pending reset request found');
    }

    if (reset.confirmationToken !== dto.confirmationToken) {
      throw new BadRequestException('Invalid confirmation token');
    }

    const elapsed = Date.now() - reset.createdAt.getTime();
    if (elapsed < RESET_CONFIRMATION_DELAY_MS) {
      const remaining = Math.ceil(
        (RESET_CONFIRMATION_DELAY_MS - elapsed) / 1_000,
      );
      throw new BadRequestException(
        `Please wait ${remaining}s before confirming the reset`,
      );
    }

    // Apply the reset
    await this.applyReset(userId, reset.resetType);

    reset.status = ResetStatus.COMPLETED;
    reset.confirmedAt = new Date();
    reset.completedAt = new Date();

    const saved = await this.resetRepository.save(reset);

    await this.writeAudit(userId, AccountAuditAction.RESET_COMPLETED, {
      resetId: saved.id,
      resetType: reset.resetType,
    });

    this.logger.log(`Reset completed for user ${userId} (type: ${reset.resetType})`);
    return saved;
  }

  /**
   * Cancel a pending reset before confirmation.
   */
  async cancelReset(userId: string): Promise<AccountReset> {
    const reset = await this.resetRepository.findOne({
      where: { userId, status: ResetStatus.PENDING },
    });

    if (!reset) {
      throw new NotFoundException('No pending reset request found');
    }

    reset.status = ResetStatus.CANCELLED;
    reset.cancelledAt = new Date();

    const saved = await this.resetRepository.save(reset);

    await this.writeAudit(userId, AccountAuditAction.RESET_CANCELLED, {
      resetId: saved.id,
    });

    return saved;
  }

  // ─── Backup / Recovery ────────────────────────────────────────────────────

  /**
   * Retrieve the backup snapshot from the most recently completed reset.
   * Allows data recovery if a reset was performed accidentally.
   */
  async getLastBackup(userId: string): Promise<Record<string, any> | null> {
    const lastCompleted = await this.resetRepository.findOne({
      where: { userId, status: ResetStatus.COMPLETED },
      order: { completedAt: 'DESC' },
    });

    return lastCompleted?.backupSnapshot ?? null;
  }

  // ─── Account Linking ──────────────────────────────────────────────────────

  /**
   * Link an external account (e.g. Google, Discord) to this user account.
   * Persisted in the user's metadata field for flexibility.
   */
  async linkAccount(
    userId: string,
    dto: LinkAccountDto,
    ipAddress?: string,
  ): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User ${userId} not found`);

    const linkedAccounts: Record<string, string> =
      ((user as any).linkedAccounts as Record<string, string>) ?? {};

    if (linkedAccounts[dto.provider]) {
      throw new BadRequestException(
        `A ${dto.provider} account is already linked`,
      );
    }

    linkedAccounts[dto.provider] = dto.externalId;
    (user as any).linkedAccounts = linkedAccounts;

    const saved = await this.userRepository.save(user);

    await this.writeAudit(userId, AccountAuditAction.ACCOUNT_LINKED, {
      provider: dto.provider,
    }, ipAddress);

    return saved;
  }

  async unlinkAccount(
    userId: string,
    provider: string,
    ipAddress?: string,
  ): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User ${userId} not found`);

    const linkedAccounts: Record<string, string> =
      ((user as any).linkedAccounts as Record<string, string>) ?? {};

    if (!linkedAccounts[provider]) {
      throw new BadRequestException(`No ${provider} account is linked`);
    }

    delete linkedAccounts[provider];
    (user as any).linkedAccounts = linkedAccounts;

    const saved = await this.userRepository.save(user);

    await this.writeAudit(userId, AccountAuditAction.ACCOUNT_UNLINKED, {
      provider,
    }, ipAddress);

    return saved;
  }

  // ─── Audit Trail ─────────────────────────────────────────────────────────

  async getAuditTrail(
    userId: string,
    limit: number = 50,
  ): Promise<AccountAuditTrail[]> {
    return this.auditRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private async buildBackupSnapshot(userId: string): Promise<Record<string, any>> {
    // In a full implementation this would gather XP, inventory, battle-pass
    // data etc. from the relevant services/repositories.
    return {
      userId,
      capturedAt: new Date().toISOString(),
      note: 'Backup captured before progression reset',
    };
  }

  private async applyReset(userId: string, resetType: ResetType): Promise<void> {
    // Dispatch to domain services based on reset type.
    // Kept as a structured stub so the caller can integrate with
    // XpService, InventoryService, BattlePassService, etc. without
    // creating circular dependencies in this module.
    this.logger.log(`Applying reset of type "${resetType}" for user ${userId}`);
  }

  private async writeAudit(
    userId: string,
    action: AccountAuditAction,
    metadata?: Record<string, any>,
    ipAddress?: string,
  ): Promise<void> {
    const trail = this.auditRepository.create({
      userId,
      action,
      metadata,
      ipAddress,
    });
    await this.auditRepository.save(trail);
  }
}
