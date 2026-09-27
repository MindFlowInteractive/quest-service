import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModerationAudit } from '../entities/moderation-audit.entity';
import { AuditAction } from '../enums/moderation.enums';

@Injectable()
export class ModerationAuditService {
  private readonly logger = new Logger(ModerationAuditService.name);

  constructor(
    @InjectRepository(ModerationAudit)
    private readonly auditRepo: Repository<ModerationAudit>,
  ) {}

  async log(
    params: {
      flagId?: string;
      userId?: string;
      actorId?: string;
      action: AuditAction;
      metadata?: Record<string, unknown>;
      notes?: string;
    },
  ): Promise<ModerationAudit> {
    const entry = this.auditRepo.create(params);
    const saved = await this.auditRepo.save(entry);
    this.logger.debug(`Audit logged: action=${params.action} flagId=${params.flagId}`);
    return saved;
  }

  async getAuditTrail(flagId: string): Promise<ModerationAudit[]> {
    return this.auditRepo.find({
      where: { flagId },
      order: { createdAt: 'ASC' },
    });
  }

  async getUserHistory(userId: string, limit = 50): Promise<ModerationAudit[]> {
    return this.auditRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getRecentActions(limit = 100): Promise<ModerationAudit[]> {
    return this.auditRepo.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
