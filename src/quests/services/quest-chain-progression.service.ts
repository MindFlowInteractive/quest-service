import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UserQuestChainProgress } from '../entities/user-quest-chain-progress.entity';
import { QuestChainPuzzle } from '../entities/quest-chain-puzzle.entity';
import { PuzzleCompletionDto } from '../dto/puzzle-completion.dto';

@Injectable()
export class QuestChainProgressionService {
  constructor(
    @InjectRepository(UserQuestChainProgress)
    private readonly userProgressRepository: Repository<UserQuestChainProgress>,
    @InjectRepository(QuestChainPuzzle)
    private readonly questChainPuzzleRepository: Repository<QuestChainPuzzle>,
  ) {}

  async startChain(userId: string, chainId: string): Promise<UserQuestChainProgress> {
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
        startedAt: new Date(),
        lastPlayedAt: new Date(),
      });

      return await this.userProgressRepository.save(progress);
    } catch (error) {
      throw new BadRequestException(`Failed to start quest chain: ${error.message}`);
    }
  }

  async getProgress(userId: string, chainId: string): Promise<UserQuestChainProgress> {
    const progress = await this.userProgressRepository.findOne({
      where: { userId, questChainId: chainId },
    });

    if (!progress) {
      throw new NotFoundException('User progress not found for this quest chain');
    }

    return progress;
  }

  async getNextPuzzle(userId: string, chainId: string): Promise<{ puzzle: any; chainPuzzle: QuestChainPuzzle } | null> {
    const progress = await this.getProgress(userId, chainId);
    
    if (progress.status === 'completed') {
      return null;
    }

    const chainPuzzles = await this.questChainPuzzleRepository.find({
      where: { questChainId: chainId },
      order: { sequenceOrder: 'ASC' },
      relations: ['puzzle'],
    });

    // Find the next puzzle that hasn't been completed and meets unlock conditions
    for (const chainPuzzle of chainPuzzles) {
      const isCompleted = progress.completedPuzzleIds.includes(chainPuzzle.puzzleId);
      
      if (!isCompleted && this.checkUnlockConditions(chainPuzzle, progress)) {
        return {
          puzzle: chainPuzzle.puzzle,
          chainPuzzle,
        };
      }
    }

    return null;
  }

  async completePuzzle(
    userId: string, 
    chainId: string, 
    puzzleId: string, 
    completionData: PuzzleCompletionDto
  ): Promise<UserQuestChainProgress> {
    const progress = await this.getProgress(userId, chainId);
    const chainPuzzle = await this.questChainPuzzleRepository.findOne({
      where: { questChainId: chainId, puzzleId },
      relations: ['puzzle'],
    });

    if (!chainPuzzle) {
      throw new BadRequestException('Puzzle not found in this quest chain');
    }

    // Check if puzzle is already completed
    if (progress.completedPuzzleIds.includes(puzzleId)) {
      return progress;
    }

    // Check unlock conditions
    if (!this.checkUnlockConditions(chainPuzzle, progress)) {
      throw new BadRequestException('Unlock conditions not met for this puzzle');
    }

    try {
      // Update progress
      progress.completedPuzzleIds = [...progress.completedPuzzleIds, puzzleId];
      progress.currentPuzzleIndex = Math.max(progress.currentPuzzleIndex, chainPuzzle.sequenceOrder);
      progress.totalScore += completionData.score;
      progress.totalTime += completionData.timeTaken;
      progress.totalHintsUsed += completionData.hintsUsed;
      progress.lastPlayedAt = new Date();

      // Store checkpoint data
      if (chainPuzzle.isCheckpoint) {
        progress.checkpointData[puzzleId] = {
          completedAt: new Date(),
          score: completionData.score,
          timeTaken: completionData.timeTaken,
          hintsUsed: completionData.hintsUsed,
        };
      }

      // Evaluate branching conditions
      const nextPuzzleId = this.evaluateBranchConditions(chainPuzzle, completionData);
      if (nextPuzzleId) {
        progress.branchPath[chainPuzzle.id] = nextPuzzleId;
      }

      // Check if chain is completed
      const chainPuzzles = await this.questChainPuzzleRepository.find({
        where: { questChainId: chainId },
      });

      const allPuzzlesCompleted = chainPuzzles.every(cp => 
        progress.completedPuzzleIds.includes(cp.puzzleId)
      );

      if (allPuzzlesCompleted) {
        progress.status = 'completed';
        progress.completedAt = new Date();
        // Award completion rewards would go here
      }

      return await this.userProgressRepository.save(progress);
    } catch (error) {
      throw new BadRequestException(`Failed to complete puzzle: ${error.message}`);
    }
  }

  checkUnlockConditions(chainPuzzle: QuestChainPuzzle, userProgress: UserQuestChainProgress): boolean {
    const { unlockConditions } = chainPuzzle;
    
    if (!unlockConditions) return true;

    // Check previous puzzles completed
    if (unlockConditions.previousPuzzles) {
      const allPreviousCompleted = unlockConditions.previousPuzzles.every(puzzleId =>
        userProgress.completedPuzzleIds.includes(puzzleId)
      );
      if (!allPreviousCompleted) return false;
    }

    // Check minimum score
    if (unlockConditions.minimumScore && userProgress.totalScore < unlockConditions.minimumScore) {
      return false;
    }

    // Check time limit (cumulative)
    if (unlockConditions.timeLimit && userProgress.totalTime > unlockConditions.timeLimit) {
      return false;
    }

    // Check no hints used
    if (unlockConditions.noHints && userProgress.totalHintsUsed > 0) {
      return false;
    }

    return true;
  }

  evaluateBranchConditions(chainPuzzle: QuestChainPuzzle, completionData: PuzzleCompletionDto): string | null {
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
          valueToCheck = ((maxHints - completionData.hintsUsed) / maxHints) * 100;
          break;
        case 'custom':
          // Custom logic would be implemented here
          continue;
        default:
          continue;
      }

      const meetsCondition = this.evaluateCondition(valueToCheck, condition.operator, condition.value);
      if (meetsCondition) {
        return condition.nextPuzzleId;
      }
    }

    return null;
  }

  private evaluateCondition(value: number, operator: string, conditionValue: number | [number, number]): boolean {
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

  async resetProgress(userId: string, chainId: string): Promise<void> {
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

      await this.userProgressRepository.save(progress);
    } catch (error) {
      throw new BadRequestException(`Failed to reset progress: ${error.message}`);
    }
  }
}