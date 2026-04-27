import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AccountFlag,
  FlagType,
  FlagStatus,
  AccountSuspensionStatus,
} from '../entities/account-flag.entity';
import { SuspendAccountDto } from '../dto/fraud.dto';

@Injectable()
export class AccountFlagService {
  private readonly logger = new Logger(AccountFlagService.name);

  constructor(
    @InjectRepository(AccountFlag)
    private readonly flagRepo: Repository<AccountFlag>,
  ) {}

  // ── Flag management ───────────────────────────────────────────────────────

  /**
   * Add a fraud flag to a player account.
   * Creates the AccountFlag record if it doesn't exist yet.
   */
  async flagAccount(
    playerId: string,
    flagType: FlagType,
    actionBy: string,
    reason: string,
  ): Promise<AccountFlag> {
    let record = await this.flagRepo.findOne({ where: { playerId } });

    if (!record) {
      record = this.flagRepo.create({
        playerId,
        flags: [],
        flagStatus: FlagStatus.ACTIVE,
        currentRiskScore: 0,
        suspensionStatus: AccountSuspensionStatus.NONE,
        flagCount: 0,
        history: {},
      });
    }

    if (!record.flags.includes(flagType)) {
      record.flags = [...record.flags, flagType];
    }

    record.flagCount += 1;
    record.actionTakenBy = actionBy;
    record.flagStatus = FlagStatus.ACTIVE;

    // Append to history log
    const historyEntry = {
      action: 'flagged',
      flagType,
      reason,
      by: actionBy,
      at: new Date().toISOString(),
    };
    record.history = {
      ...record.history,
      [`flag_${record.flagCount}`]: historyEntry,
    };

    const saved = await this.flagRepo.save(record);
    this.logger.warn(`Account flagged: player=${playerId} type=${flagType}`);
    return saved;
  }

  async updateRiskScore(playerId: string, score: number): Promise<AccountFlag> {
    let record = await this.flagRepo.findOne({ where: { playerId } });

    if (!record) {
      record = this.flagRepo.create({
        playerId,
        flags: [],
        flagStatus: FlagStatus.ACTIVE,
        currentRiskScore: score,
        suspensionStatus: AccountSuspensionStatus.NONE,
        flagCount: 0,
        history: {},
      });
    } else {
      record.currentRiskScore = score;
    }

    return this.flagRepo.save(record);
  }

  async liftFlag(
    playerId: string,
    actionBy: string,
    reason: string,
  ): Promise<AccountFlag> {
    const record = await this.flagRepo.findOne({ where: { playerId } });
    if (!record) throw new NotFoundException('Account flag record not found');

    record.flagStatus = FlagStatus.LIFTED;
    record.flags = [];
    record.actionTakenBy = actionBy;

    const historyEntry = {
      action: 'flag_lifted',
      reason,
      by: actionBy,
      at: new Date().toISOString(),
    };
    record.history = {
      ...record.history,
      [`lift_${Date.now()}`]: historyEntry,
    };

    this.logger.log(`Flag lifted for player=${playerId} by=${actionBy}`);
    return this.flagRepo.save(record);
  }

  // ── Suspension management ─────────────────────────────────────────────────

  async suspendAccount(
    playerId: string,
    actionBy: string,
    dto: SuspendAccountDto,
  ): Promise<AccountFlag> {
    let record = await this.flagRepo.findOne({ where: { playerId } });

    if (!record) {
      record = this.flagRepo.create({
        playerId,
        flags: [],
        flagStatus: FlagStatus.ACTIVE,
        currentRiskScore: 0,
        suspensionStatus: AccountSuspensionStatus.NONE,
        flagCount: 0,
        history: {},
      });
    }

    const isPermanent = !dto.durationHours;
    record.suspensionStatus = isPermanent
      ? AccountSuspensionStatus.PERMANENT
      : AccountSuspensionStatus.TEMPORARY;

    record.suspensionReason = dto.reason;
    record.actionTakenBy = actionBy;

    if (!isPermanent) {
      record.suspendedUntil = new Date(
        Date.now() + dto.durationHours * 60 * 60 * 1000,
      );
    }

    const historyEntry = {
      action: isPermanent ? 'permanently_suspended' : 'temporarily_suspended',
      reason: dto.reason,
      durationHours: dto.durationHours ?? 'permanent',
      suspendedUntil: record.suspendedUntil?.toISOString() ?? 'indefinite',
      by: actionBy,
      at: new Date().toISOString(),
    };
    record.history = {
      ...record.history,
      [`suspension_${Date.now()}`]: historyEntry,
    };

    const saved = await this.flagRepo.save(record);
    this.logger.warn(
      `Account suspended: player=${playerId} type=${record.suspensionStatus} reason="${dto.reason}"`,
    );
    return saved;
  }

  async unsuspendAccount(
    playerId: string,
    actionBy: string,
  ): Promise<AccountFlag> {
    const record = await this.flagRepo.findOne({ where: { playerId } });
    if (!record) throw new NotFoundException('Account flag record not found');

    record.suspensionStatus = AccountSuspensionStatus.NONE;
    record.suspendedUntil = null;
    record.actionTakenBy = actionBy;

    const historyEntry = {
      action: 'unsuspended',
      by: actionBy,
      at: new Date().toISOString(),
    };
    record.history = {
      ...record.history,
      [`unsuspend_${Date.now()}`]: historyEntry,
    };

    this.logger.log(`Account unsuspended: player=${playerId}`);
    return this.flagRepo.save(record);
  }

  async isAccountSuspended(playerId: string): Promise<boolean> {
    const record = await this.flagRepo.findOne({ where: { playerId } });
    if (!record) return false;

    if (record.suspensionStatus === AccountSuspensionStatus.PERMANENT) return true;

    if (
      record.suspensionStatus === AccountSuspensionStatus.TEMPORARY &&
      record.suspendedUntil &&
      new Date() < record.suspendedUntil
    ) {
      return true;
    }

    // Auto-expire temporary suspension
    if (
      record.suspensionStatus === AccountSuspensionStatus.TEMPORARY &&
      record.suspendedUntil &&
      new Date() >= record.suspendedUntil
    ) {
      record.suspensionStatus = AccountSuspensionStatus.NONE;
      await this.flagRepo.save(record);
    }

    return false;
  }

  async getAccountStatus(playerId: string): Promise<AccountFlag | null> {
    return this.flagRepo.findOne({ where: { playerId } });
  }

  async getFlaggedAccounts(page = 1, limit = 20): Promise<{ accounts: AccountFlag[]; total: number }> {
    const [accounts, total] = await this.flagRepo.findAndCount({
      where: { flagStatus: FlagStatus.ACTIVE },
      order: { currentRiskScore: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { accounts, total };
  }
}
