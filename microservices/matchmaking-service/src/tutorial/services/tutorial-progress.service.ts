import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tutorial } from '../entities/tutorial.entity';
import { TutorialStep } from '../entities/tutorial-step.entity';
import {
  UserTutorialProgress,
  StepProgress,
  AdaptiveState,
  LearningSpeed,
} from '../entities/user-tutorial-progress.entity';
import { TutorialService } from './tutorial.service';
import { TutorialAnalyticsService } from './tutorial-analytics.service';
import {
  StartTutorialDto,
  UpdateStepProgressDto,
  SkipTutorialDto,
  SkipStepDto,
  ResumeTutorialDto,
  SaveCheckpointDto,
} from '../dto';

interface ResumeResponse {
  progress: UserTutorialProgress;
  nextStep: TutorialStep | null;
  checkpoint?: any;
}

@Injectable()
export class TutorialProgressService {
  private readonly logger = new Logger(TutorialProgressService.name);

  constructor(
    @InjectRepository(UserTutorialProgress)
    private readonly progressRepo: Repository<UserTutorialProgress>,
    @InjectRepository(TutorialStep)
    private readonly stepRepo: Repository<TutorialStep>,
    private readonly tutorialService: TutorialService,
    private readonly analyticsService: TutorialAnalyticsService,
  ) {}

  // Progress Management
  async startTutorial(userId: string, dto: StartTutorialDto): Promise<UserTutorialProgress> {
    const tutorial = await this.tutorialService.findById(dto.tutorialId);

    // Check prerequisites
    const { valid, missing } = await this.tutorialService.validatePrerequisites(
      userId,
      dto.tutorialId,
    );
    if (!valid) {
      throw new ForbiddenException(
        `Prerequisites not met. Missing tutorials: ${missing.join(', ')}`,
      );
    }

    // Check for existing progress
    let progress = await this.progressRepo.findOne({
      where: { userId, tutorialId: dto.tutorialId },
    });

    if (progress) {
      if (progress.status === 'completed') {
        // Allow restart
        progress.status = 'in_progress';
        progress.currentStepOrder = 0;
        progress.currentStepId = undefined;
        progress.completedSteps = 0;
        progress.progressPercentage = 0;
        progress.totalTimeSpent = 0;
        progress.stepProgress = [];
        progress.startedAt = new Date();
        progress.completedAt = undefined;
      } else if (dto.resumeFromCheckpoint && progress.sessionData?.checkpoints?.length) {
        // Resume from checkpoint
        progress.lastActivityAt = new Date();
        return this.progressRepo.save(progress);
      }
    } else {
      // Get total steps count
      const steps = await this.tutorialService.getStepsByTutorial(dto.tutorialId);

      progress = this.progressRepo.create({
        userId,
        tutorialId: dto.tutorialId,
        status: 'in_progress',
        currentStepOrder: 0,
        totalSteps: steps.length,
        completedSteps: 0,
        progressPercentage: 0,
        totalTimeSpent: 0,
        stepProgress: [],
        adaptiveState: { learningSpeed: 'normal', proficiencyLevel: 0 },
        sessionData: { lastSessionId: dto.sessionId },
        startedAt: new Date(),
        lastActivityAt: new Date(),
      });
    }

    const saved = await this.progressRepo.save(progress);

    // Track analytics
    await this.analyticsService.trackEvent({
      eventType: 'tutorial_started',
      userId,
      tutorialId: dto.tutorialId,
      payload: { sessionId: dto.sessionId },
    });

    this.logger.log(`User ${userId} started tutorial: ${dto.tutorialId}`);
    return saved;
  }

  async updateStepProgress(userId: string, dto: UpdateStepProgressDto): Promise<UserTutorialProgress> {
    const progress = await this.getOrCreateProgress(userId, dto.tutorialId);
    const step = await this.tutorialService.getStepById(dto.stepId);

    // Find or create step progress entry
    let stepProgress = progress.stepProgress.find((sp) => sp.stepId === dto.stepId);
    if (!stepProgress) {
      stepProgress = {
        stepId: dto.stepId,
        stepOrder: step.order,
        status: 'pending',
        attempts: 0,
        timeSpent: 0,
        hintsUsed: 0,
      };
      progress.stepProgress.push(stepProgress);
    }

    // Update step progress
    stepProgress.status = dto.status;
    stepProgress.attempts += 1;
    stepProgress.timeSpent += dto.timeSpent || 0;
    stepProgress.score = dto.score;
    stepProgress.hintsUsed += dto.hintsUsed || 0;
    if (dto.errors) {
      stepProgress.errors = [...(stepProgress.errors || []), ...dto.errors];
    }

    if (dto.status === 'completed') {
      stepProgress.completedAt = new Date();
      progress.completedSteps = progress.stepProgress.filter(
        (sp) => sp.status === 'completed',
      ).length;

      // Track analytics
      await this.analyticsService.trackEvent({
        eventType: 'step_completed',
        userId,
        tutorialId: dto.tutorialId,
        stepId: dto.stepId,
        payload: {
          timeSpent: dto.timeSpent,
          score: dto.score,
          attempts: stepProgress.attempts,
          hintsUsed: stepProgress.hintsUsed,
        },
      });
    }

    // Update current step to next
    const nextStep = await this.getNextStep(userId, dto.tutorialId);
    if (nextStep) {
      progress.currentStepId = nextStep.id;
      progress.currentStepOrder = nextStep.order;
    }

    // Update progress percentage
    progress.progressPercentage =
      progress.totalSteps > 0
        ? Math.round((progress.completedSteps / progress.totalSteps) * 100)
        : 0;

    // Update total time
    progress.totalTimeSpent += dto.timeSpent || 0;
    progress.lastActivityAt = new Date();

    // Save checkpoint if provided
    if (dto.saveState) {
      await this.saveCheckpoint(userId, {
        tutorialId: dto.tutorialId,
        stepId: dto.stepId,
        state: dto.saveState,
      });
    }

    // Adjust adaptive pacing
    await this.adjustAdaptivePacing(progress, stepProgress);

    const saved = await this.progressRepo.save(progress);

    // Check if tutorial is complete
    if (progress.completedSteps >= progress.totalSteps) {
      await this.completeTutorial(userId, dto.tutorialId);
    }

    return saved;
  }

  async completeTutorial(userId: string, tutorialId: string): Promise<UserTutorialProgress> {
    const progress = await this.getUserProgress(userId, tutorialId);

    progress.status = 'completed';
    progress.completedAt = new Date();
    progress.progressPercentage = 100;

    // Calculate overall score
    const scores = progress.stepProgress
      .filter((sp) => sp.score !== undefined)
      .map((sp) => sp.score!);
    if (scores.length > 0) {
      progress.overallScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    }

    const saved = await this.progressRepo.save(progress);

    // Track analytics
    await this.analyticsService.trackEvent({
      eventType: 'tutorial_completed',
      userId,
      tutorialId,
      payload: {
        completionSummary: {
          totalTime: progress.totalTimeSpent,
          totalSteps: progress.totalSteps,
          completedSteps: progress.completedSteps,
          overallScore: progress.overallScore || 0,
        },
      },
    });

    // Update tutorial analytics
    await this.tutorialService.updateTutorialAnalytics(tutorialId);

    this.logger.log(`User ${userId} completed tutorial: ${tutorialId}`);
    return saved;
  }

  async getUserProgress(userId: string, tutorialId: string): Promise<UserTutorialProgress> {
    const progress = await this.progressRepo.findOne({
      where: { userId, tutorialId },
      relations: ['tutorial'],
    });
    if (!progress) {
      throw new NotFoundException(`Progress not found for user ${userId} on tutorial ${tutorialId}`);
    }
    return progress;
  }

  async getAllUserProgress(userId: string): Promise<UserTutorialProgress[]> {
    return this.progressRepo.find({
      where: { userId },
      relations: ['tutorial'],
      order: { lastActivityAt: 'DESC' },
    });
  }

  // Skip and Resume
  async skipTutorial(userId: string, dto: SkipTutorialDto): Promise<UserTutorialProgress> {
    const tutorial = await this.tutorialService.findById(dto.tutorialId);

    if (!tutorial.isSkippable && !dto.confirmSkip) {
      throw new BadRequestException(
        'This tutorial is not skippable. Set confirmSkip to true to force skip.',
      );
    }

    let progress = await this.progressRepo.findOne({
      where: { userId, tutorialId: dto.tutorialId },
    });

    if (!progress) {
      const steps = await this.tutorialService.getStepsByTutorial(dto.tutorialId);
      progress = this.progressRepo.create({
        userId,
        tutorialId: dto.tutorialId,
        totalSteps: steps.length,
        adaptiveState: { learningSpeed: 'normal', proficiencyLevel: 0 },
        sessionData: {},
      });
    }

    progress.status = 'skipped';
    progress.lastActivityAt = new Date();

    const saved = await this.progressRepo.save(progress);

    // Track analytics
    await this.analyticsService.trackEvent({
      eventType: 'tutorial_skipped',
      userId,
      tutorialId: dto.tutorialId,
      payload: { skipReason: dto.reason },
    });

    this.logger.log(`User ${userId} skipped tutorial: ${dto.tutorialId}`);
    return saved;
  }

  async skipStep(userId: string, dto: SkipStepDto): Promise<UserTutorialProgress> {
    const progress = await this.getUserProgress(userId, dto.tutorialId);
    const step = await this.tutorialService.getStepById(dto.stepId);

    if (!step.isOptional) {
      throw new BadRequestException('This step is not optional and cannot be skipped.');
    }

    let stepProgress = progress.stepProgress.find((sp) => sp.stepId === dto.stepId);
    if (!stepProgress) {
      stepProgress = {
        stepId: dto.stepId,
        stepOrder: step.order,
        status: 'skipped',
        attempts: 0,
        timeSpent: 0,
        hintsUsed: 0,
      };
      progress.stepProgress.push(stepProgress);
    } else {
      stepProgress.status = 'skipped';
    }

    progress.lastActivityAt = new Date();

    // Move to next step
    const nextStep = await this.getNextStep(userId, dto.tutorialId);
    if (nextStep) {
      progress.currentStepId = nextStep.id;
      progress.currentStepOrder = nextStep.order;
    }

    return this.progressRepo.save(progress);
  }

  async resumeTutorial(userId: string, dto: ResumeTutorialDto): Promise<ResumeResponse> {
    const progress = await this.getUserProgress(userId, dto.tutorialId);

    if (progress.status === 'completed') {
      throw new BadRequestException('Tutorial already completed. Start again to restart.');
    }

    progress.status = 'in_progress';
    progress.lastActivityAt = new Date();

    let nextStep: TutorialStep | null = null;
    let checkpoint: any = undefined;

    if (dto.fromStepId) {
      nextStep = await this.tutorialService.getStepById(dto.fromStepId);
      progress.currentStepId = dto.fromStepId;
      progress.currentStepOrder = nextStep.order;
    } else if (dto.fromCheckpoint && progress.sessionData?.checkpoints?.length) {
      const latestCheckpoint = progress.sessionData.checkpoints[
        progress.sessionData.checkpoints.length - 1
      ];
      nextStep = await this.tutorialService.getStepById(latestCheckpoint.stepId);
      checkpoint = latestCheckpoint.state;
      progress.currentStepId = latestCheckpoint.stepId;
    } else {
      nextStep = await this.getNextStep(userId, dto.tutorialId);
    }

    await this.progressRepo.save(progress);

    return { progress, nextStep, checkpoint };
  }

  async saveCheckpoint(userId: string, dto: SaveCheckpointDto): Promise<void> {
    const progress = await this.getUserProgress(userId, dto.tutorialId);

    const checkpoints = progress.sessionData?.checkpoints || [];
    checkpoints.push({
      stepId: dto.stepId,
      state: dto.state,
      savedAt: new Date(),
    });

    // Keep only last 5 checkpoints
    if (checkpoints.length > 5) {
      checkpoints.shift();
    }

    progress.sessionData = {
      ...progress.sessionData,
      checkpoints,
    };

    await this.progressRepo.save(progress);

    await this.analyticsService.trackEvent({
      eventType: 'checkpoint_saved',
      userId,
      tutorialId: dto.tutorialId,
      stepId: dto.stepId,
      payload: {},
    });
  }

  // Adaptive Pacing
  async getNextStep(userId: string, tutorialId: string): Promise<TutorialStep | null> {
    const progress = await this.progressRepo.findOne({
      where: { userId, tutorialId },
    });

    const completedStepIds = new Set(
      progress?.stepProgress
        .filter((sp) => sp.status === 'completed' || sp.status === 'skipped')
        .map((sp) => sp.stepId) || [],
    );

    const steps = await this.tutorialService.getStepsByTutorial(tutorialId);
    const nextStep = steps.find(
      (step) => step.isActive && !completedStepIds.has(step.id),
    );

    if (!nextStep) return null;

    // Check if step should be skipped due to proficiency
    if (progress && await this.shouldSkipStep(progress, nextStep)) {
      // Mark as auto-skipped and get next
      await this.updateStepProgress(userId, {
        tutorialId,
        stepId: nextStep.id,
        status: 'skipped',
      });
      return this.getNextStep(userId, tutorialId);
    }

    return nextStep;
  }

  async getAdaptiveState(userId: string, tutorialId: string): Promise<AdaptiveState> {
    const progress = await this.getUserProgress(userId, tutorialId);
    return progress.adaptiveState;
  }

  private async shouldSkipStep(
    progress: UserTutorialProgress,
    step: TutorialStep,
  ): Promise<boolean> {
    if (!step.adaptivePacing?.skipIfProficient) return false;

    const threshold = step.adaptivePacing.proficiencyThreshold || 0.8;
    return progress.adaptiveState.proficiencyLevel >= threshold;
  }

  private async adjustAdaptivePacing(
    progress: UserTutorialProgress,
    stepProgress: StepProgress,
  ): Promise<void> {
    const state = progress.adaptiveState;

    // Calculate learning speed based on time spent vs average
    const avgStepTime = progress.totalTimeSpent / (progress.completedSteps || 1);
    if (stepProgress.timeSpent < avgStepTime * 0.5) {
      state.learningSpeed = 'fast';
    } else if (stepProgress.timeSpent > avgStepTime * 1.5) {
      state.learningSpeed = 'slow';
    } else {
      state.learningSpeed = 'normal';
    }

    // Update proficiency based on scores and attempts
    if (stepProgress.score !== undefined) {
      const performanceScore = (stepProgress.score / 100) * (1 / stepProgress.attempts);
      state.proficiencyLevel = (state.proficiencyLevel + performanceScore) / 2;
    }

    // Track struggling areas based on errors
    if (stepProgress.errors && stepProgress.errors.length > 2) {
      state.strugglingAreas = state.strugglingAreas || [];
      state.strugglingAreas.push(stepProgress.stepId);
    }

    // Track strong areas based on high scores
    if (stepProgress.score && stepProgress.score >= 90 && stepProgress.attempts === 1) {
      state.strongAreas = state.strongAreas || [];
      state.strongAreas.push(stepProgress.stepId);
    }

    progress.adaptiveState = state;
  }

  private async getOrCreateProgress(
    userId: string,
    tutorialId: string,
  ): Promise<UserTutorialProgress> {
    let progress = await this.progressRepo.findOne({
      where: { userId, tutorialId },
    });

    if (!progress) {
      const steps = await this.tutorialService.getStepsByTutorial(tutorialId);
      progress = this.progressRepo.create({
        userId,
        tutorialId,
        status: 'in_progress',
        totalSteps: steps.length,
        completedSteps: 0,
        progressPercentage: 0,
        totalTimeSpent: 0,
        stepProgress: [],
        adaptiveState: { learningSpeed: 'normal', proficiencyLevel: 0 },
        sessionData: {},
        startedAt: new Date(),
        lastActivityAt: new Date(),
      });
      progress = await this.progressRepo.save(progress);
    }

    return progress;
  }

  async getCompletedTutorials(userId: string): Promise<string[]> {
    const progress = await this.progressRepo.find({
      where: { userId, status: 'completed' },
      select: ['tutorialId'],
    });
    return progress.map((p) => p.tutorialId);
  }
}
