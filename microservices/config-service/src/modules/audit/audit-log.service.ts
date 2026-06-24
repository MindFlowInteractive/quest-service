import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../../entities';

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async log(
    action: string,
    entityType: string,
    entityId: string,
    changes?: Record<string, any>,
    userId?: string,
    ipAddress?: string,
    reason?: string,
    severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL' = 'INFO',
  ): Promise<AuditLog> {
    const auditLog = this.auditLogRepository.create({
      action,
      entityType,
      entityId,
      changes: changes ? JSON.stringify(changes) : null,
      userId,
      ipAddress,
      reason,
      severity,
    });

    return this.auditLogRepository.save(auditLog);
  }

  async getEntityAuditLogs(
    entityType: string,
    entityId: string,
    limit = 50,
  ): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { entityType, entityId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getActionAuditLogs(
    action: string,
    limit = 50,
  ): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { action },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getRecentAuditLogs(limit = 100): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
