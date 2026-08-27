import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/constants';
import { AdminAuditLogService } from '../services/admin-audit-log.service';

@Controller('admin/audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminAuditController {
  constructor(private readonly auditLogService: AdminAuditLogService) {}

  @Get()
  async getLogs(
    @Query('adminId') adminId?: string,
    @Query('action') action?: string,
    @Query('targetType') targetType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit = '50',
    @Query('offset') offset = '0',
  ) {
    const [data, total] = await this.auditLogService.getLogs(
      {
        adminId,
        action,
        targetType,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      },
      Math.min(Math.max(Number(limit) || 50, 1), 100),
      Math.max(Number(offset) || 0, 0),
    );

    return { data, total };
  }
}
