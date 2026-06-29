import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountController } from './account.controller';
import { PrivacyModule } from '../privacy/privacy.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PrivacyModule,
    NotificationsModule,
  ],
  controllers: [AccountController],
})
export class AccountModule {}
