import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminAuditLog } from '../entities/admin-audit-log.entity';

@Injectable()
export class AdminAuditLogService {
    constructor(
        @InjectRepository(AdminAuditLog)
        private auditLogRepository: Repository<AdminAuditLog>,
    ) { }

    async log(data: {
        adminId: string;
        action: string;
        targetType: string;
        targetId?: string;
        details?: any;
        ipAddress?: string;
        userAgent?: string;
    }): Promise<AdminAuditLog> {
        const logEntry = this.auditLogRepository.create(data);
        return await this.auditLogRepository.save(logEntry);
    }

    async getLogs(
        filters: {
            adminId?: string;
            action?: string;
            targetType?: string;
            startDate?: Date;
            endDate?: Date;
        },
        limit = 50,
        offset = 0,
    ): Promise<[AdminAuditLog[], number]> {
        const query = this.auditLogRepository.createQueryBuilder('log')
            .leftJoinAndSelect('log.admin', 'admin')
            .orderBy('log.createdAt', 'DESC')
            .take(limit)
            .skip(offset);

        if (filters.adminId) {
            query.andWhere('log.adminId = :adminId', { adminId: filters.adminId });
        }

        if (filters.action) {
            query.andWhere('log.action = :action', { action: filters.action });
        }

        if (filters.targetType) {
            query.andWhere('log.targetType = :targetType', { targetType: filters.targetType });
        }

        if (filters.startDate) {
            query.andWhere('log.createdAt >= :startDate', { startDate: filters.startDate });
        }

        if (filters.endDate) {
            query.andWhere('log.createdAt <= :endDate', { endDate: filters.endDate });
        }

        return await query.getManyAndCount();
    }
}
