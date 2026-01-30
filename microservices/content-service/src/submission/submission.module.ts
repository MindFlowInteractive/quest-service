import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Submission } from '../entities/submission.entity.js';
import { ModerationQueue } from '../entities/moderation-queue.entity.js';
import { ContentModule } from '../content/content.module.js';
import { SubmissionController } from './submission.controller.js';
import { SubmissionService } from './submission.service.js';
import { ContentValidationService } from './content-validation.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Submission, ModerationQueue]),
    ContentModule,
  ],
  controllers: [SubmissionController],
  providers: [SubmissionService, ContentValidationService],
  exports: [SubmissionService, ContentValidationService],
})
export class SubmissionModule {}
