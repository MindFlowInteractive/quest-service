import { Module } from '@nestjs/common';
import { MatchmakingModule } from './matchmaking/matchmaking.module';

@Module({
  imports: [MatchmakingModule],
})
export class AppModule {}
