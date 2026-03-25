import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HintsService } from './hints.service';
import { HintsController } from './hints.controller';
import { PlayerEventsModule } from '../player-events/player-events.module';
import { Hint } from './entities/hint.entity';
import { HintUsage } from './entities/hint-usage.entity';
import { HintTemplate } from './entities/hint-template.entity';
import { PuzzlesModule } from '../puzzles/puzzles.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Hint, HintUsage, HintTemplate]),
    PuzzlesModule,
    PlayerEventsModule,
  ],
  controllers: [HintsController],
  providers: [HintsService],
  exports: [HintsService],
})
export class HintsModule {}
