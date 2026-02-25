import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CollectionEntity } from './entities/collection.entity';
import { Category } from './entities/category.entity';
import { PuzzleCollection } from './entities/puzzle-collection.entity';
import { UserPuzzleCompletion } from './entities/user-puzzle-completion.entity';
import { UserCollectionProgress } from './entities/user-collection-progress.entity';
import { CollectionsService } from './collections.service';
import { CollectionsController } from './collections.controller';
import { CategoriesController } from './categories.controller';
import { RewardService } from './reward.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CollectionEntity,
      Category,
      PuzzleCollection,
      UserPuzzleCompletion,
      UserCollectionProgress,
    ]),
  ],
  providers: [CollectionsService, RewardService],
  controllers: [CollectionsController, CategoriesController],
  exports: [CollectionsService, RewardService],
})
export class CollectionsModule {}
