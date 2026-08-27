import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/constants';
import { CdnService } from '../../cdn/cdn.service';
import { AdminAuditLogService } from '../services/admin-audit-log.service';
import { ActiveUser } from '../../auth/decorators/active-user.decorator';

@Controller('admin/cdn')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminCdnController {
  constructor(
    private readonly cdnService: CdnService,
    private readonly auditLogService: AdminAuditLogService,
  ) {}

  @Get('metrics')
  getMetrics() {
    return this.cdnService.getMetrics();
  }

  @Get('health')
  health() {
    return this.cdnService.healthCheck();
  }

  @Post('purge')
  async purge(
    @Body('keys') keys: string[],
    @ActiveUser() admin: { id: string },
  ) {
    const result = await this.cdnService.purge(keys || []);
    await this.auditLogService.log({
      adminId: admin.id,
      action: 'PURGE_CDN',
      targetType: 'CDN',
      details: { keys: keys || [], ...result },
    });
    return result;
  }
}
