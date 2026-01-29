/**
 * Puzzle Editor Module
 * Comprehensive module for puzzle creation and editing functionality
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { PuzzleEditor } from './entities/puzzle-editor.entity';
import { PuzzleEditorVersion } from './entities/puzzle-editor-version.entity';
import { PuzzleTemplate } from './entities/puzzle-template.entity';
import { CommunitySubmission } from './entities/community-submission.entity';
import { CommunityReview } from './entities/community-review.entity';
import { PuzzleEditorActivity } from './entities/puzzle-editor-activity.entity';

// Services
import { PuzzleEditorService } from './services/puzzle-editor.service';
import { PuzzleValidationService } from './services/puzzle-validation.service';
import { PuzzlePreviewService } from './services/puzzle-preview.service';
import { PuzzleTemplateService } from './services/puzzle-template.service';
import { CommunitySubmissionService } from './services/community-submission.service';
import { PuzzleImportExportService } from './services/puzzle-import-export.service';
import { BatchOperationsService } from './services/batch-operations.service';

// Controllers
import { PuzzleEditorController } from './controllers/puzzle-editor.controller';
import { PuzzlePreviewController } from './controllers/puzzle-preview.controller';
import { PuzzleTemplateController } from './controllers/puzzle-template.controller';
import { CommunitySubmissionController } from './controllers/community-submission.controller';
import { BatchOperationsController } from './controllers/batch-operations.controller';

// External modules
import { Puzzle } from '../puzzles/entities/puzzle.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PuzzleEditor,
      PuzzleEditorVersion,
      PuzzleTemplate,
      CommunitySubmission,
      CommunityReview,
      PuzzleEditorActivity,
      Puzzle,
      User,
    ]),
  ],
  controllers: [
    PuzzleEditorController,
    PuzzlePreviewController,
    PuzzleTemplateController,
    CommunitySubmissionController,
    BatchOperationsController,
  ],
  providers: [
    PuzzleEditorService,
    PuzzleValidationService,
    PuzzlePreviewService,
    PuzzleTemplateService,
    CommunitySubmissionService,
    PuzzleImportExportService,
    BatchOperationsService,
  ],
  exports: [
    PuzzleEditorService,
    PuzzleValidationService,
    PuzzlePreviewService,
    PuzzleTemplateService,
    CommunitySubmissionService,
    PuzzleImportExportService,
    BatchOperationsService,
  ],
})
export class PuzzleEditorModule {}
