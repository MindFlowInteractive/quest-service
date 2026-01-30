import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StreaksService } from './streaks.service';
import { StreaksController } from './streaks.controller';
import { UserStreak } from './entities/user-streak.entity';
import { UserCombo } from './entities/user-combo.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserStreak, UserCombo])],
  controllers: [StreaksController],
  providers: [StreaksService],
  exports: [StreaksService],
})
export class StreaksModule {}
