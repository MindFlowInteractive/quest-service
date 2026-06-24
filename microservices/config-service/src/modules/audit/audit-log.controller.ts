import { Controller, Get, Param, Query } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { AuditLog } from '../../entities';

@Controller('audit-logs')
export class AuditLogController {
  constructor(private auditLogService: AuditLogService) {}

  @Get()
  async getRecentLogs(
    @Query('limit') limit: string = '100',
  ): Promise<AuditLog[]> {
    return this.auditLogService.getRecentAuditLogs(parseInt(limit, 10));
  }

  @Get('entity/:entityType/:entityId')
  async getEntityLogs(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @Query('limit') limit: string = '50',
  ): Promise<AuditLog[]> {
    return this.auditLogService.getEntityAuditLogs(
      entityType,
      entityId,
      parseInt(limit, 10),
    );
  }

  @Get('action/:action')
  async getActionLogs(
    @Param('action') action: string,
    @Query('limit') limit: string = '50',
  ): Promise<AuditLog[]> {
    return this.auditLogService.getActionAuditLogs(
      action,
      parseInt(limit, 10),
    );
  }
}
