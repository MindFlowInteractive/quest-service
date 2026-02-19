import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { QuestChain } from './entities/quest-chain.entity';
import { QuestChainPuzzle } from './entities/quest-chain-puzzle.entity';
import { UserQuestChainProgress } from './entities/user-quest-chain-progress.entity';
import { QuestChainService } from './services/quest-chain.service';
import { QuestChainProgressionService } from './services/quest-chain-progression.service';
import { QuestChainValidationService } from './services/quest-chain-validation.service';
import { QuestChainController } from './controllers/quest-chain.controller';
import { QuestChainProgressController } from './controllers/quest-chain-progress.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      QuestChain,
      QuestChainPuzzle,
      UserQuestChainProgress,
    ]),
  ],
  controllers: [QuestChainController, QuestChainProgressController],
  providers: [
    QuestChainService,
    QuestChainProgressionService,
    QuestChainValidationService,
  ],
  exports: [
    QuestChainService,
    QuestChainProgressionService,
    QuestChainValidationService,
  ],
})
export class QuestsModule {}