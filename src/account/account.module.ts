import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountController } from './account.controller';
import { AccountManagementService } from './account-management.service';
import { AccountReset } from './entities/account-reset.entity';
import { AccountAuditTrail } from './entities/account-audit-trail.entity';
import { PrivacyModule } from '../privacy/privacy.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, AccountReset, AccountAuditTrail]),
    PrivacyModule,
    NotificationsModule,
  ],
  controllers: [AccountController],
  providers: [AccountManagementService],
  exports: [AccountManagementService],
})
export class AccountModule {}
