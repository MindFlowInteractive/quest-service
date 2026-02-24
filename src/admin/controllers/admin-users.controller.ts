import {
    Controller,
    Get,
    Body,
    Patch,
    Param,
    UseGuards,
    ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/constants';
import { AdminUsersService } from '../services/admin-users.service';
import { AdminAuditLogService } from '../services/admin-audit-log.service';
import { ActiveUser } from '../../auth/decorators/active-user.decorator';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminUsersController {
    constructor(
        private readonly adminUsersService: AdminUsersService,
        private readonly auditLogService: AdminAuditLogService,
    ) { }

    @Get()
    async findAll() {
        return await this.adminUsersService.findAll();
    }

    @Patch(':id/role')
    async updateRole(
        @Param('id', ParseUUIDPipe) id: string,
        @Body('role') role: UserRole,
        @ActiveUser() admin: any,
    ) {
        const user = await this.adminUsersService.updateRole(id, role);
        await this.auditLogService.log({
            adminId: admin.id,
            action: 'UPDATE_USER_ROLE',
            targetType: 'USER',
            targetId: id,
            details: { role },
        });
        return user;
    }

    @Patch(':id/status')
    async updateStatus(
        @Param('id', ParseUUIDPipe) id: string,
        @Body('isVerified') isVerified: boolean,
        @ActiveUser() admin: any,
    ) {
        const user = await this.adminUsersService.updateStatus(id, isVerified);
        await this.auditLogService.log({
            adminId: admin.id,
            action: 'UPDATE_USER_STATUS',
            targetType: 'USER',
            targetId: id,
            details: { isVerified },
        });
        return user;
    }
}
