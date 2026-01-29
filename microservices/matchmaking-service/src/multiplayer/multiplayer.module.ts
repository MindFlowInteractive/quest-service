import { Module } from '@nestjs/common';
import { MultiplayerService } from './services/multiplayer.service';
import { MultiplayerGateway } from './gateways/multiplayer.gateway';
import { LeaderboardModule } from '../leaderboard/leaderboard.module';
import { CacheModule } from '@nestjs/cache-manager';
import { GameEngineModule } from '../game-engine/game-engine.module';
import { PuzzlesModule } from '../puzzles/puzzles.module';

@Module({
    imports: [
        LeaderboardModule,
        CacheModule.register(),
        GameEngineModule,
        PuzzlesModule,
    ],
    providers: [MultiplayerService, MultiplayerGateway],
    exports: [MultiplayerService],
})
export class MultiplayerModule { }
