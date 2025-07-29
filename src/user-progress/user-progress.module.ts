import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserProgress } from './entities/user-progress.entity';
import { UserProgressService } from './services/user-progress.service';
import { UserProgressController } from './controller/user-progress.controller';
import { UsersModule } from '../users/users.module'; // for user relations

@Module({
  imports: [
    TypeOrmModule.forFeature([UserProgress]),
    UsersModule,
  ],
  controllers: [UserProgressController],
  providers: [UserProgressService],
  exports: [UserProgressService],
})
export class UserProgressModule {}
