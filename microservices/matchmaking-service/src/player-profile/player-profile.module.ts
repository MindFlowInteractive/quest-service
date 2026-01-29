import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlayerProfile } from './entities/player-profile.entity';
import { User } from '../users/entities/user.entity';
import { PlayerProfileController } from './player-profile.controller';
import { PlayerProfileService } from './services/player-profile.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PlayerProfile, User]),
    AuthModule,
  ],
  controllers: [PlayerProfileController],
  providers: [PlayerProfileService],
  exports: [PlayerProfileService],
})
export class PlayerProfileModule {}