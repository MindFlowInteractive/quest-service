import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminAuditLog } from './entities/admin-audit-log.entity';
import { AdminAuditLogService } from './services/admin-audit-log.service';
import { AdminUsersService } from './services/admin-users.service';
import { AdminPuzzlesController } from './controllers/admin-puzzles.controller';
import { AdminUsersController } from './controllers/admin-users.controller';
import { AdminAnalyticsController } from './controllers/admin-analytics.controller';
import { AdminModerationController } from './controllers/admin-moderation.controller';
import { AdminMonitoringController } from './controllers/admin-monitoring.controller';
import { PuzzlesModule } from '../puzzles/puzzles.module';
import { AuthModule } from '../auth/auth.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { User } from '../auth/entities/user.entity';
import { Role } from '../auth/entities/role.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([AdminAuditLog, User, Role]),
        PuzzlesModule,
        AuthModule,
        AnalyticsModule,
    ],
    controllers: [
        AdminPuzzlesController,
        AdminUsersController,
        AdminAnalyticsController,
        AdminModerationController,
        AdminMonitoringController,
    ],
    providers: [
        AdminAuditLogService,
        AdminUsersService,
    ],
    exports: [
        AdminAuditLogService,
        AdminUsersService,
    ],
})
export class AdminModule { }
