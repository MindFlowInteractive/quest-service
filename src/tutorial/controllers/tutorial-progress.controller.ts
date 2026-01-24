import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
  Logger,
} from '@nestjs/common';
import { TutorialProgressService } from '../services/tutorial-progress.service';
import {
  StartTutorialDto,
  UpdateStepProgressDto,
  SkipTutorialDto,
  SkipStepDto,
  ResumeTutorialDto,
  SaveCheckpointDto,
} from '../dto';

@Controller('tutorial-progress')
export class TutorialProgressController {
  private readonly logger = new Logger(TutorialProgressController.name);

  constructor(private readonly progressService: TutorialProgressService) {}

  // Start Tutorial
  @Post('user/:userId/start')
  async startTutorial(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: StartTutorialDto,
  ) {
    this.logger.log(`User ${userId} starting tutorial: ${dto.tutorialId}`);
    return this.progressService.startTutorial(userId, dto);
  }

  // Get All Progress for User
  @Get('user/:userId')
  async getAllProgress(@Param('userId', ParseUUIDPipe) userId: string) {
    this.logger.log(`Fetching all progress for user: ${userId}`);
    return this.progressService.getAllUserProgress(userId);
  }

  // Get Specific Tutorial Progress
  @Get('user/:userId/tutorial/:tutorialId')
  async getProgress(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('tutorialId', ParseUUIDPipe) tutorialId: string,
  ) {
    this.logger.log(`Fetching progress for user ${userId} on tutorial ${tutorialId}`);
    return this.progressService.getUserProgress(userId, tutorialId);
  }

  // Update Step Progress
  @Post('user/:userId/step')
  async updateStepProgress(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: UpdateStepProgressDto,
  ) {
    this.logger.log(`Updating step progress for user ${userId}`);
    return this.progressService.updateStepProgress(userId, dto);
  }

  // Skip Tutorial
  @Post('user/:userId/skip')
  async skipTutorial(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: SkipTutorialDto,
  ) {
    this.logger.log(`User ${userId} skipping tutorial: ${dto.tutorialId}`);
    return this.progressService.skipTutorial(userId, dto);
  }

  // Skip Step
  @Post('user/:userId/skip-step')
  async skipStep(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: SkipStepDto,
  ) {
    this.logger.log(`User ${userId} skipping step: ${dto.stepId}`);
    return this.progressService.skipStep(userId, dto);
  }

  // Resume Tutorial
  @Post('user/:userId/resume')
  async resumeTutorial(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: ResumeTutorialDto,
  ) {
    this.logger.log(`User ${userId} resuming tutorial: ${dto.tutorialId}`);
    return this.progressService.resumeTutorial(userId, dto);
  }

  // Save Checkpoint
  @Post('user/:userId/checkpoint')
  async saveCheckpoint(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: SaveCheckpointDto,
  ) {
    this.logger.log(`Saving checkpoint for user ${userId} on tutorial ${dto.tutorialId}`);
    await this.progressService.saveCheckpoint(userId, dto);
    return { message: 'Checkpoint saved successfully' };
  }

  // Get Next Step
  @Get('user/:userId/tutorial/:tutorialId/next-step')
  async getNextStep(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('tutorialId', ParseUUIDPipe) tutorialId: string,
  ) {
    this.logger.log(`Getting next step for user ${userId} on tutorial ${tutorialId}`);
    return this.progressService.getNextStep(userId, tutorialId);
  }

  // Get Adaptive State
  @Get('user/:userId/tutorial/:tutorialId/adaptive-state')
  async getAdaptiveState(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('tutorialId', ParseUUIDPipe) tutorialId: string,
  ) {
    this.logger.log(`Getting adaptive state for user ${userId} on tutorial ${tutorialId}`);
    return this.progressService.getAdaptiveState(userId, tutorialId);
  }

  // Complete Tutorial
  @Post('user/:userId/tutorial/:tutorialId/complete')
  async completeTutorial(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('tutorialId', ParseUUIDPipe) tutorialId: string,
  ) {
    this.logger.log(`Completing tutorial ${tutorialId} for user ${userId}`);
    return this.progressService.completeTutorial(userId, tutorialId);
  }

  // Get Completed Tutorials
  @Get('user/:userId/completed')
  async getCompletedTutorials(@Param('userId', ParseUUIDPipe) userId: string) {
    this.logger.log(`Getting completed tutorials for user ${userId}`);
    return this.progressService.getCompletedTutorials(userId);
  }
}
