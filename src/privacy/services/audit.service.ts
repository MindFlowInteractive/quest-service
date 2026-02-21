import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import {
  DataAccessAudit,
  DataAccessType,
  DataAccessEntity,
  AccessReason,
} from '../entities/data-access-audit.entity';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(DataAccessAudit)
    private auditRepository: Repository<DataAccessAudit>,
  ) {}

  /**
   * Log a data access event
   */
  async logAccess(data: {
    userId: string;
    accessedBy: string;
    accessType: DataAccessType;
    entityType: DataAccessEntity;
    entityId?: string;
    accessReason: AccessReason;
    ipAddress?: string;
    userAgent?: string;
    accessDetails?: any;
    changesMade?: { before?: any; after?: any };
  }): Promise<DataAccessAudit> {
    const audit = this.auditRepository.create(data);
    return this.auditRepository.save(audit);
  }

  /**
   * Get audit logs for a user
   */
  async getUserAuditLogs(
    userId: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
      accessType?: DataAccessType;
      limit?: number;
      offset?: number;
    },
  ): Promise<{ logs: DataAccessAudit[]; total: number }> {
    const where: any = { userId };

    if (options?.startDate && options?.endDate) {
      where.createdAt = Between(options.startDate, options.endDate);
    }

    if (options?.accessType) {
      where.accessType = options.accessType;
    }

    const [logs, total] = await this.auditRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      take: options?.limit || 50,
      skip: options?.offset || 0,
    });

    return { logs, total };
  }

  /**
   * Get audit logs by accessor (for admin monitoring)
   */
  async getAccessorLogs(
    accessedBy: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    },
  ): Promise<DataAccessAudit[]> {
    const where: any = { accessedBy };

    if (options?.startDate && options?.endDate) {
      where.createdAt = Between(options.startDate, options.endDate);
    }

    return this.auditRepository.find({
      where,
      order: { createdAt: 'DESC' },
      take: options?.limit || 100,
    });
  }

  /**
   * Get data access statistics
   */
  async getAccessStatistics(options?: {
    startDate?: Date;
    endDate?: Date;
  }): Promise<{
    totalAccesses: number;
    byType: Record<DataAccessType, number>;
    byEntity: Record<DataAccessEntity, number>;
    byReason: Record<AccessReason, number>;
    uniqueUsersAccessed: number;
    uniqueAccessors: number;
  }> {
    const where: any = {};

    if (options?.startDate && options?.endDate) {
      where.createdAt = Between(options.startDate, options.endDate);
    }

    const logs = await this.auditRepository.find({ where });

    const byType = {} as Record<DataAccessType, number>;
    const byEntity = {} as Record<DataAccessEntity, number>;
    const byReason = {} as Record<AccessReason, number>;

    const uniqueUsers = new Set<string>();
    const uniqueAccessors = new Set<string>();

    for (const log of logs) {
      byType[log.accessType] = (byType[log.accessType] || 0) + 1;
      byEntity[log.entityType] = (byEntity[log.entityType] || 0) + 1;
      byReason[log.accessReason] = (byReason[log.accessReason] || 0) + 1;
      uniqueUsers.add(log.userId);
      uniqueAccessors.add(log.accessedBy);
    }

    return {
      totalAccesses: logs.length,
      byType,
      byEntity,
      byReason,
      uniqueUsersAccessed: uniqueUsers.size,
      uniqueAccessors: uniqueAccessors.size,
    };
  }

  /**
   * Check for suspicious access patterns
   */
  async detectSuspiciousActivity(userId?: string): Promise<{
    suspicious: boolean;
    alerts: string[];
  }> {
    const alerts: string[] = [];
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const where: any = {
      createdAt: Between(last24Hours, new Date()),
    };

    if (userId) {
      where.userId = userId;
    }

    const recentLogs = await this.auditRepository.find({ where });

    // Check for high volume of exports
    const exports = recentLogs.filter(log => log.accessType === DataAccessType.EXPORT);
    if (exports.length > 10) {
      alerts.push(`High number of data exports (${exports.length}) in last 24 hours`);
    }

    // Check for multiple failed access attempts
    const uniqueAccessors = new Map<string, number>();
    for (const log of recentLogs) {
      const count = uniqueAccessors.get(log.accessedBy) || 0;
      uniqueAccessors.set(log.accessedBy, count + 1);
    }

    for (const [accessor, count] of uniqueAccessors) {
      if (count > 100) {
        alerts.push(`User ${accessor} has unusually high access count (${count})`);
      }
    }

    return {
      suspicious: alerts.length > 0,
      alerts,
    };
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(startDate: Date, endDate: Date): Promise<{
    period: string;
    totalAccesses: number;
    dataExports: number;
    dataDeletions: number;
    anonymizations: number;
    consentChanges: number;
    uniqueUsers: number;
    topAccessors: { accessorId: string; count: number }[];
  }> {
    const logs = await this.auditRepository.find({
      where: {
        createdAt: Between(startDate, endDate),
      },
    });

    const uniqueUsers = new Set(logs.map(log => log.userId));
    const accessorCounts = new Map<string, number>();

    for (const log of logs) {
      const count = accessorCounts.get(log.accessedBy) || 0;
      accessorCounts.set(log.accessedBy, count + 1);
    }

    const topAccessors = Array.from(accessorCounts.entries())
      .map(([accessorId, count]) => ({ accessorId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      period: `${startDate.toISOString()} to ${endDate.toISOString()}`,
      totalAccesses: logs.length,
      dataExports: logs.filter(l => l.accessType === DataAccessType.EXPORT).length,
      dataDeletions: logs.filter(l => l.accessType === DataAccessType.DELETE).length,
      anonymizations: logs.filter(l => l.accessType === DataAccessType.ANONYMIZE).length,
      consentChanges: logs.filter(l => l.accessReason === AccessReason.DATA_DELETION).length,
      uniqueUsers: uniqueUsers.size,
      topAccessors,
    };
  }
}
