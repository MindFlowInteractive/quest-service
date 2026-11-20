import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UserQuestChainProgress } from '../entities/user-quest-chain-progress.entity';
import { QuestChainPuzzle } from '../entities/quest-chain-puzzle.entity';
import { PuzzleCompletionDto } from '../dto/puzzle-completion.dto';
import { QuestChain, StoryChapter } from '../entities/quest-chain.entity';

export interface CampaignStageProgress {
  puzzleId: string;
  sequenceOrder: number;
  narrative?: string;
  isOptional: boolean;
  completed: boolean;
  unlocked: boolean;
}

export interface CampaignChapterProgress extends StoryChapter {
  unlocked: boolean;
  completed: boolean;
  stages: CampaignStageProgress[];
}

export interface CampaignProgress {
  questChainId: string;
  status: UserQuestChainProgress['status'];
  completedPuzzleIds: string[];
  currentChapterId: string | null;
  completedChapterIds: string[];
  chapters: CampaignChapterProgress[];
}

@Injectable()
export class QuestChainProgressionService {
  private readonly logger = new Logger(QuestChainProgressionService.name);

  constructor(
    @InjectRepository(UserQuestChainProgress)
    private readonly userProgressRepository: Repository<UserQuestChainProgress>,
    @InjectRepository(QuestChainPuzzle)
    private readonly questChainPuzzleRepository: Repository<QuestChainPuzzle>,
    @InjectRepository(QuestChain)
    private readonly questChainRepository: Repository<QuestChain>,
  ) {}

  async startChain(
    userId: string,
    chainId: string,
    mode: 'standard' | 'time_attack' = 'standard',
    timeLimitSeconds = 300,
  ): Promise<UserQuestChainProgress> {
    if (mode !== 'standard' && mode !== 'time_attack') {
      throw new BadRequestException('Unsupported quest mode');
    }
    if (
      !Number.isInteger(timeLimitSeconds) ||
      timeLimitSeconds < 30 ||
      timeLimitSeconds > 3600
    ) {
      throw new BadRequestException(
        'Time attack limit must be between 30 and 3600 seconds',
      );
    }
    // Check if user already has progress for this chain
    const existingProgress = await this.userProgressRepository.findOne({
      where: { userId, questChainId: chainId },
    });

    if (existingProgress && existingProgress.status !== 'abandoned') {
      return existingProgress;
    }

    try {
      const progress = this.userProgressRepository.create({
        userId,
        questChainId: chainId,
        status: 'in_progress',
        currentPuzzleIndex: 0,
        completedPuzzleIds: [],
        checkpointData: {},
        branchPath: {},
        totalScore: 0,
        totalTime: 0,
        totalHintsUsed: 0,
        mode,
        startedAt: new Date(),
        deadlineAt:
          mode === 'time_attack'
            ? new Date(Date.now() + timeLimitSeconds * 1000)
            : null,
        lastPlayedAt: new Date(),
      });

      return await this.userProgressRepository.save(progress);
    } catch (error) {
      throw new BadRequestException(
        `Failed to start quest chain: ${error.message}`,
      );
    }
  }

  async getProgress(
    userId: string,
    chainId: string,
  ): Promise<UserQuestChainProgress> {
    const progress = await this.userProgressRepository.findOne({
      where: { userId, questChainId: chainId },
    });

    if (!progress) {
      throw new NotFoundException(
        'User progress not found for this quest chain',
      );
    }

    return progress;
  }

  async getNextPuzzle(
    userId: string,
    chainId: string,
  ): Promise<{
    puzzle: any;
    chainPuzzle: QuestChainPuzzle;
    narrative?: string;
  } | null> {
    const progress = await this.getProgress(userId, chainId);
    const chain = await this.questChainRepository.findOne({
      where: { id: chainId },
    });
    if (!chain) {
      throw new NotFoundException(`Quest chain with ID ${chainId} not found`);
    }
    const chainPuzzles = await this.questChainPuzzleRepository.find({
      where: { questChainId: chainId },
      order: { sequenceOrder: 'ASC' },
      relations: ['puzzle'],
    });

    const availableStages = chainPuzzles.filter(
      (stage) =>
        !progress.completedPuzzleIds.includes(stage.puzzleId) &&
        this.isStageUnlocked(
          stage,
          chainPuzzles,
          chain.story?.chapters ?? [],
          progress,
        ),
    );
    const nextStage =
      availableStages.find((stage) => !stage.isOptional) ?? availableStages[0];

    if (nextStage) {
      return {
        puzzle: nextStage.puzzle,
        chainPuzzle: nextStage,
        narrative: nextStage.narrative,
      };
    }

    return null;
  }

  async getCampaignProgress(
    userId: string,
    chainId: string,
  ): Promise<CampaignProgress> {
    const chain = await this.questChainRepository.findOne({
      where: { id: chainId },
    });
    if (!chain) {
      throw new NotFoundException(`Quest chain with ID ${chainId} not found`);
    }

    const progress = await this.getProgress(userId, chainId);
    const chainPuzzles = await this.questChainPuzzleRepository.find({
      where: { questChainId: chainId },
      order: { sequenceOrder: 'ASC' },
    });
    const chapters = (chain.story?.chapters ?? []).map((chapter, index) => {
      const chapterStages = chainPuzzles.filter(
        (stage) => stage.chapterId === chapter.id,
      );
      const unlocked = this.isChapterUnlocked(
        index,
        chain.story.chapters,
        chainPuzzles,
        progress,
      );
      const completed =
        unlocked &&
        chapterStages
          .filter((stage) => !stage.isOptional)
          .every((stage) =>
            progress.completedPuzzleIds.includes(stage.puzzleId),
          );

      return {
        ...chapter,
        unlocked,
        completed,
        stages: chapterStages.map((stage) => ({
          puzzleId: stage.puzzleId,
          sequenceOrder: stage.sequenceOrder,
          narrative: stage.narrative,
          isOptional: Boolean(stage.isOptional),
          completed: progress.completedPuzzleIds.includes(stage.puzzleId),
          unlocked: this.isStageUnlocked(
            stage,
            chainPuzzles,
            chain.story.chapters,
            progress,
          ),
        })),
      };
    });

    return {
      questChainId: chainId,
      status: progress.status,
      completedPuzzleIds: progress.completedPuzzleIds,
      currentChapterId:
        chapters.find((chapter) => chapter.unlocked && !chapter.completed)
          ?.id ?? null,
      completedChapterIds: chapters
        .filter((chapter) => chapter.completed)
        .map((chapter) => chapter.id),
      chapters,
    };
  }

  async completePuzzle(
    userId: string,
    chainId: string,
    puzzleId: string,
    completionData: PuzzleCompletionDto,
  ): Promise<UserQuestChainProgress> {
    const progress = await this.getProgress(userId, chainId);
    const chainPuzzle = await this.questChainPuzzleRepository.findOne({
      where: { questChainId: chainId, puzzleId },
      relations: ['puzzle'],
    });

    if (!chainPuzzle) {
      throw new BadRequestException('Puzzle not found in this quest chain');
    }

    const chain = await this.questChainRepository.findOne({
      where: { id: chainId },
    });
    if (!chain) {
      throw new NotFoundException(`Quest chain with ID ${chainId} not found`);
    }

    // Check if puzzle is already completed
    if (progress.completedPuzzleIds.includes(puzzleId)) {
      return progress;
    }

    const chainPuzzles = await this.questChainPuzzleRepository.find({
      where: { questChainId: chainId },
    });

    if (
      !this.isStageUnlocked(
        chainPuzzle,
        chainPuzzles,
        chain.story?.chapters ?? [],
        progress,
      )
    ) {
      throw new BadRequestException(
        'Unlock conditions not met for this puzzle',
      );
    }

    const now = new Date();
    if (
      progress.mode === 'time_attack' &&
      progress.deadlineAt &&
      now >= progress.deadlineAt
    ) {
      throw new BadRequestException('Time attack has expired');
    }

    try {
      const wasCompleted = progress.status === 'completed';
      // Update progress
      progress.completedPuzzleIds = [...progress.completedPuzzleIds, puzzleId];
      progress.currentPuzzleIndex = Math.max(
        progress.currentPuzzleIndex,
        chainPuzzle.sequenceOrder,
      );
      progress.totalScore += completionData.score;
      progress.totalTime =
        progress.mode === 'time_attack' && progress.startedAt
          ? Math.max(
              0,
              Math.ceil((now.getTime() - progress.startedAt.getTime()) / 1000),
            )
          : progress.totalTime + completionData.timeTaken;
      progress.totalHintsUsed += completionData.hintsUsed;
      progress.lastPlayedAt = new Date();

      // Store checkpoint data and award checkpoint rewards
      if (chainPuzzle.isCheckpoint) {
        progress.checkpointData[puzzleId] = {
          completedAt: new Date(),
          score: completionData.score,
          timeTaken: completionData.timeTaken,
          hintsUsed: completionData.hintsUsed,
        };

        // Award checkpoint rewards
        await this.awardCheckpointRewards(userId, chainPuzzle);
      }

      // Evaluate branching conditions and update path
      const nextPuzzleId = this.evaluateBranchConditions(
        chainPuzzle,
        completionData,
      );
      if (nextPuzzleId) {
        progress.branchPath[chainPuzzle.id] = nextPuzzleId;
      }

      // Check if chain is completed
      const requiredPuzzles = chainPuzzles.filter(
        (puzzle) => !puzzle.isOptional,
      );
      const allPuzzlesCompleted = requiredPuzzles.every((puzzle) =>
        progress.completedPuzzleIds.includes(puzzle.puzzleId),
      );

      if (allPuzzlesCompleted) {
        progress.status = 'completed';
        progress.completedAt = now;
        if (
          !wasCompleted &&
          progress.mode === 'time_attack' &&
          progress.deadlineAt
        ) {
          const remainingSeconds = Math.max(
            0,
            Math.floor((progress.deadlineAt.getTime() - now.getTime()) / 1000),
          );
          progress.totalScore += Math.min(
            remainingSeconds,
            Math.floor(progress.totalScore * 0.2),
          );
        }

        if (!wasCompleted) {
          await this.awardCompletionRewards(userId, chainId);
          await this.incrementChainCompletionCount(chainId);
        }
      }

      return await this.userProgressRepository.save(progress);
    } catch (error) {
      throw new BadRequestException(
        `Failed to complete puzzle: ${error.message}`,
      );
    }
  }

  private async awardCheckpointRewards(
    userId: string,
    chainPuzzle: QuestChainPuzzle,
  ): Promise<void> {
    const rewards = chainPuzzle.checkpointRewards;
    if (!rewards) return;

    // This would typically integrate with the economy/reward system
    // For now, we'll log the reward distribution
    this.logger.log(
      `Awarding checkpoint rewards to user ${userId}: XP=${rewards.xp}, Coins=${
        rewards.coins
      }, Items=${rewards.items.join(',')}`,
    );

    // In a real implementation, you would call the reward service here
    // await this.rewardService.awardRewards(userId, rewards);
  }

  private async awardCompletionRewards(
    userId: string,
    chainId: string,
  ): Promise<void> {
    const chain = await this.questChainRepository.findOne({
      where: { id: chainId },
      relations: ['chainPuzzles'],
    });

    if (!chain || !chain.rewards) return;

    const completionRewards = chain.rewards.completion;

    // Award milestone rewards
    if (chain.rewards.milestones) {
      const chainPuzzles = await this.questChainPuzzleRepository.find({
        where: { questChainId: chainId },
      });

      for (const milestone of chain.rewards.milestones) {
        if (chainPuzzles.length >= milestone.puzzleIndex) {
          this.logger.log(
            `Awarding milestone rewards to user ${userId} for reaching puzzle ${
              milestone.puzzleIndex
            }: XP=${milestone.rewards.xp}, Coins=${
              milestone.rewards.coins
            }, Items=${milestone.rewards.items.join(',')}`,
          );

          // In a real implementation, you would call the reward service here
          // await this.rewardService.awardRewards(userId, milestone.rewards);
        }
      }
    }

    // Award completion rewards
    if (completionRewards) {
      this.logger.log(
        `Awarding completion rewards to user ${userId} for chain ${chainId}: XP=${
          completionRewards.xp
        }, Coins=${
          completionRewards.coins
        }, Items=${completionRewards.items.join(',')}`,
      );

      // In a real implementation, you would call the reward service here
      // await this.rewardService.awardRewards(userId, completionRewards);
    }
  }

  private async incrementChainCompletionCount(chainId: string): Promise<void> {
    await this.questChainRepository
      .createQueryBuilder()
      .update(QuestChain)
      .set({
        completionCount: () => '"completionCount" + 1',
      })
      .where('id = :id', { id: chainId })
      .execute();
  }

  checkUnlockConditions(
    chainPuzzle: QuestChainPuzzle,
    userProgress: UserQuestChainProgress,
  ): boolean {
    const { unlockConditions } = chainPuzzle;

    if (!unlockConditions) return true;

    // Check previous puzzles completed
    if (unlockConditions.previousPuzzles) {
      const allPreviousCompleted = unlockConditions.previousPuzzles.every(
        (puzzleId) => userProgress.completedPuzzleIds.includes(puzzleId),
      );
      if (!allPreviousCompleted) return false;
    }

    // Check minimum score
    if (
      unlockConditions.minimumScore &&
      userProgress.totalScore < unlockConditions.minimumScore
    ) {
      return false;
    }

    // Check time limit (cumulative)
    if (
      unlockConditions.timeLimit &&
      userProgress.totalTime > unlockConditions.timeLimit
    ) {
      return false;
    }

    // Check no hints used
    if (unlockConditions.noHints && userProgress.totalHintsUsed > 0) {
      return false;
    }

    return true;
  }

  private isStageUnlocked(
    stage: QuestChainPuzzle,
    stages: QuestChainPuzzle[],
    chapters: StoryChapter[],
    progress: UserQuestChainProgress,
  ): boolean {
    let stageWithRequiredConditions = stage;
    if (!stage.isOptional && stage.chapterId && stage.unlockConditions) {
      const optionalPuzzleIds = new Set(
        stages
          .filter((candidate) => candidate.isOptional)
          .map((candidate) => candidate.puzzleId),
      );
      stageWithRequiredConditions = {
        ...stage,
        unlockConditions: {
          ...stage.unlockConditions,
          previousPuzzles:
            stage.unlockConditions.previousPuzzles?.filter(
              (puzzleId) => !optionalPuzzleIds.has(puzzleId),
            ) ?? [],
        },
      };
    }

    if (!this.checkUnlockConditions(stageWithRequiredConditions, progress)) {
      return false;
    }

    if (!stage.chapterId) {
      return true;
    }

    const chapterIndex = chapters.findIndex(
      (chapter) => chapter.id === stage.chapterId,
    );
    if (chapterIndex < 0) {
      return false;
    }

    if (!this.isChapterUnlocked(chapterIndex, chapters, stages, progress)) {
      return false;
    }

    if (stage.isOptional) {
      return true;
    }

    return !stages.some(
      (previousStage) =>
        previousStage.chapterId === stage.chapterId &&
        previousStage.sequenceOrder < stage.sequenceOrder &&
        !previousStage.isOptional &&
        !progress.completedPuzzleIds.includes(previousStage.puzzleId),
    );
  }

  private isChapterUnlocked(
    chapterIndex: number,
    chapters: StoryChapter[],
    stages: QuestChainPuzzle[],
    progress: UserQuestChainProgress,
  ): boolean {
    return chapters
      .slice(0, chapterIndex)
      .every((chapter) =>
        stages
          .filter(
            (stage) => stage.chapterId === chapter.id && !stage.isOptional,
          )
          .every((stage) =>
            progress.completedPuzzleIds.includes(stage.puzzleId),
          ),
      );
  }

  evaluateBranchConditions(
    chainPuzzle: QuestChainPuzzle,
    completionData: PuzzleCompletionDto,
  ): string | null {
    const { branchConditions } = chainPuzzle;

    if (!branchConditions || branchConditions.length === 0) {
      return null;
    }

    for (const condition of branchConditions) {
      let valueToCheck: number;

      switch (condition.conditionType) {
        case 'score':
          valueToCheck = completionData.score;
          break;
        case 'time':
          valueToCheck = completionData.timeTaken;
          break;
        case 'accuracy':
          // Calculate accuracy based on hints used vs max hints
          const maxHints = (chainPuzzle.puzzle as any).maxHints || 3;
          valueToCheck =
            ((maxHints - completionData.hintsUsed) / maxHints) * 100;
          break;
        case 'custom':
          // Custom logic would be implemented here
          continue;
        default:
          continue;
      }

      const meetsCondition = this.evaluateCondition(
        valueToCheck,
        condition.operator,
        condition.value,
      );
      if (meetsCondition) {
        return condition.nextPuzzleId;
      }
    }

    return null;
  }

  private evaluateCondition(
    value: number,
    operator: string,
    conditionValue: number | [number, number],
  ): boolean {
    switch (operator) {
      case 'gte':
        return value >= (conditionValue as number);
      case 'lte':
        return value <= (conditionValue as number);
      case 'equals':
        return value === (conditionValue as number);
      case 'between':
        const [min, max] = conditionValue as [number, number];
        return value >= min && value <= max;
      default:
        return false;
    }
  }

  async resetProgress(
    userId: string,
    chainId: string,
  ): Promise<UserQuestChainProgress> {
    const progress = await this.getProgress(userId, chainId);

    try {
      // Reset all progress data
      progress.status = 'not_started';
      progress.currentPuzzleIndex = 0;
      progress.completedPuzzleIds = [];
      progress.checkpointData = {};
      progress.branchPath = {};
      progress.totalScore = 0;
      progress.totalTime = 0;
      progress.totalHintsUsed = 0;
      progress.startedAt = null;
      progress.completedAt = null;
      progress.lastPlayedAt = null;

      return await this.userProgressRepository.save(progress);
    } catch (error) {
      throw new BadRequestException(
        `Failed to reset progress: ${error.message}`,
      );
    }
  }

  async resetChainProgress(chainId: string, userId: string): Promise<void> {
    await this.resetProgress(userId, chainId);
  }
}
