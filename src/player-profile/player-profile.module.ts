import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlayerProfile } from './entities/player-profile.entity';
import { User } from '../users/entities/user.entity';
import { PlayerProfileController } from './player-profile.controller';
import { CustomizationController } from './customization.controller';
import { PlayerProfileService } from './services/player-profile.service';
import { BadgeService } from './services/badge.service';
import { BannerThemeService } from './services/banner-theme.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PlayerProfile, User]),
    AuthModule,
  ],
  controllers: [PlayerProfileController, CustomizationController],
  providers: [PlayerProfileService, BadgeService, BannerThemeService],
  exports: [PlayerProfileService, BadgeService, BannerThemeService],
})
export class PlayerProfileModule {}