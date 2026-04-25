import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { GuildsService } from './guilds.service';
import { GuildsController } from './guilds.controller';
import { Guild } from './entities/guild.entity';
import { GuildMember } from './entities/guild-member.entity';
import { User } from '../users/entities/user.entity';
import { UserPuzzleCompletion } from '../users/entities/user-puzzle-completion.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Guild, GuildMember, User, UserPuzzleCompletion]),
    ScheduleModule,
  ],
  controllers: [GuildsController],
  providers: [GuildsService],
  exports: [GuildsService],
})
export class GuildsModule {}
