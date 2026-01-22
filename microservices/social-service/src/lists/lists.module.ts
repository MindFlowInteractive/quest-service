import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ListsService } from './lists.service';
import { ListsController } from './lists.controller';
import { CustomList } from './custom-list.entity';
import { ListItem } from './list-item.entity';
import { ListShare } from './list-share.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CustomList, ListItem, ListShare])],
  controllers: [ListsController],
  providers: [ListsService],
  exports: [ListsService],
})
export class ListsModule {}
