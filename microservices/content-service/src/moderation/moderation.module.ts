import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModerationQueue } from '../entities/moderation-queue.entity.js';
import { ModerationAction } from '../entities/moderation-action.entity.js';
import { Submission } from '../entities/submission.entity.js';
import { ContentModule } from '../content/content.module.js';
import { SubmissionModule } from '../submission/submission.module.js';
import { ModerationController } from './moderation.controller.js';
import { ModerationService } from './moderation.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([ModerationQueue, ModerationAction, Submission]),
    ContentModule,
    forwardRef(() => SubmissionModule),
  ],
  controllers: [ModerationController],
  providers: [ModerationService],
  exports: [ModerationService],
})
export class ModerationModule {}
