import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReplayService } from './replay.service';
import { ReplayController } from './replay.controller';
import { Replay } from '../entities/replay.entity';
import { Action } from '../entities/action.entity';
import { Recording } from '../entities/recording.entity';
import { CompressionModule } from '../compression/compression.module';
import { StorageModule } from '../storage/storage.module';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Replay, Action, Recording]),
    CompressionModule,
    StorageModule,
    AnalyticsModule,
  ],
  providers: [ReplayService],
  controllers: [ReplayController],
  exports: [ReplayService],
})
export class ReplayModule {}
