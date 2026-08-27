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
import { AdminAuditController } from './controllers/admin-audit.controller';
import { AdminNotificationsController } from './controllers/admin-notifications.controller';
import { AdminCdnController } from './controllers/admin-cdn.controller';
import { PuzzlesModule } from '../puzzles/puzzles.module';
import { AuthModule } from '../auth/auth.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { User } from '../auth/entities/user.entity';
import { Role } from '../auth/entities/role.entity';
import { PrivacyModule } from '../privacy/privacy.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { CdnModule } from '../cdn/cdn.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AdminAuditLog, User, Role]),
    PuzzlesModule,
    AuthModule,
    AnalyticsModule,
    PrivacyModule,
    NotificationsModule,
    CdnModule,
  ],
  controllers: [
    AdminPuzzlesController,
    AdminUsersController,
    AdminAnalyticsController,
    AdminModerationController,
    AdminMonitoringController,
    AdminAuditController,
    AdminNotificationsController,
    AdminCdnController,
  ],
  providers: [AdminAuditLogService, AdminUsersService],
  exports: [AdminAuditLogService, AdminUsersService],
})
export class AdminModule {}
