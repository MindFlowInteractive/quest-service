import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { QuestChain } from '../entities/quest-chain.entity';
import { QuestChainPuzzle } from '../entities/quest-chain-puzzle.entity';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

@Injectable()
export class QuestChainValidationService {
  constructor(
    @InjectRepository(QuestChain)
    private readonly questChainRepository: Repository<QuestChain>,
    @InjectRepository(QuestChainPuzzle)
    private readonly questChainPuzzleRepository: Repository<QuestChainPuzzle>,
  ) {}

  async validateChainStructure(chainId: string): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    try {
      const chain = await this.questChainRepository.findOne({
        where: { id: chainId },
      });

      if (!chain) {
        result.isValid = false;
        result.errors.push(`Quest chain with ID ${chainId} not found`);
        return result;
      }

      const chainPuzzles = await this.questChainPuzzleRepository.find({
        where: { questChainId: chainId },
        order: { sequenceOrder: 'ASC' },
      });

      if (chainPuzzles.length === 0) {
        result.warnings.push('Quest chain has no puzzles');
        return result;
      }

      // Validate sequential order
      this.validateSequentialOrder(chainPuzzles, result);

      // Validate unlock conditions
      this.validateUnlockConditions(chainPuzzles, result);

      // Validate branch conditions
      this.validateBranchConditions(chainPuzzles, result);

      // Validate story structure
      this.validateStoryStructure(chain, result);

      // Validate rewards structure
      this.validateRewardsStructure(chain, result);

      // Detect circular dependencies
      await this.detectCircularDependencies(chainId, result);

      return result;
    } catch (error) {
      result.isValid = false;
      result.errors.push(`Validation failed: ${error.message}`);
      return result;
    }
  }

  private validateSequentialOrder(chainPuzzles: QuestChainPuzzle[], result: ValidationResult): void {
    const sequenceOrders = chainPuzzles.map(cp => cp.sequenceOrder).sort((a, b) => a - b);
    
    // Check for gaps in sequence
    for (let i = 0; i < sequenceOrders.length - 1; i++) {
      if (sequenceOrders[i + 1] - sequenceOrders[i] > 1) {
        result.warnings.push(`Gap in sequence order: ${sequenceOrders[i]} to ${sequenceOrders[i + 1]}`);
      }
    }

    // Check for duplicate sequence orders
    const duplicateOrders = sequenceOrders.filter((order, index, arr) => 
      arr.indexOf(order) !== index
    );
    
    if (duplicateOrders.length > 0) {
      result.errors.push(`Duplicate sequence orders found: ${duplicateOrders.join(', ')}`);
    }

    // Check if sequence starts at 0 or 1
    const minOrder = Math.min(...sequenceOrders);
    if (minOrder !== 0 && minOrder !== 1) {
      result.warnings.push(`Sequence order starts at ${minOrder}, expected 0 or 1`);
    }
  }

  private validateUnlockConditions(chainPuzzles: QuestChainPuzzle[], result: ValidationResult): void {
    for (const chainPuzzle of chainPuzzles) {
      const { unlockConditions } = chainPuzzle;
      
      if (!unlockConditions) continue;

      // Validate previous puzzles exist
      if (unlockConditions.previousPuzzles) {
        for (const prevPuzzleId of unlockConditions.previousPuzzles) {
          const exists = chainPuzzles.some(cp => cp.puzzleId === prevPuzzleId);
          if (!exists) {
            result.errors.push(`Unlock condition references non-existent puzzle: ${prevPuzzleId}`);
          }
        }
      }

      // Validate score threshold
      if (unlockConditions.minimumScore !== undefined && unlockConditions.minimumScore < 0) {
        result.errors.push(`Invalid minimum score: ${unlockConditions.minimumScore}`);
      }

      // Validate time limit
      if (unlockConditions.timeLimit !== undefined && unlockConditions.timeLimit <= 0) {
        result.errors.push(`Invalid time limit: ${unlockConditions.timeLimit}`);
      }

      // Validate that first puzzle doesn't have previous puzzle requirements
      if (chainPuzzle.sequenceOrder === 0 && unlockConditions.previousPuzzles?.length > 0) {
        result.warnings.push('First puzzle should not have previous puzzle requirements');
      }
    }
  }

  private validateBranchConditions(chainPuzzles: QuestChainPuzzle[], result: ValidationResult): void {
    for (const chainPuzzle of chainPuzzles) {
      const { branchConditions } = chainPuzzle;
      
      if (!branchConditions || branchConditions.length === 0) continue;

      for (const condition of branchConditions) {
        // Validate condition type
        const validTypes = ['score', 'time', 'accuracy', 'custom'];
        if (!validTypes.includes(condition.conditionType)) {
          result.errors.push(`Invalid branch condition type: ${condition.conditionType}`);
        }

        // Validate operator
        const validOperators = ['gte', 'lte', 'equals', 'between'];
        if (!validOperators.includes(condition.operator)) {
          result.errors.push(`Invalid branch condition operator: ${condition.operator}`);
        }

        // Validate next puzzle exists
        const nextPuzzleExists = chainPuzzles.some(cp => cp.puzzleId === condition.nextPuzzleId);
        if (!nextPuzzleExists) {
          result.errors.push(`Branch condition references non-existent puzzle: ${condition.nextPuzzleId}`);
        }

        // Validate value format
        if (condition.operator === 'between') {
          if (!Array.isArray(condition.value) || condition.value.length !== 2) {
            result.errors.push('Between operator requires array of 2 values');
          }
        } else {
          if (typeof condition.value !== 'number') {
            result.errors.push('Non-between operators require numeric value');
          }
        }
      }
    }
  }

  private validateStoryStructure(chain: QuestChain, result: ValidationResult): void {
    const { story } = chain;
    
    if (!story) {
      result.warnings.push('No story defined for quest chain');
      return;
    }

    if (!story.intro || story.intro.trim() === '') {
      result.warnings.push('Story intro is missing');
    }

    if (!story.outro || story.outro.trim() === '') {
      result.warnings.push('Story outro is missing');
    }

    if (!story.chapters || story.chapters.length === 0) {
      result.warnings.push('No story chapters defined');
    } else {
      // Validate chapter structure
      for (const chapter of story.chapters) {
        if (!chapter.id || chapter.id.trim() === '') {
          result.errors.push('Chapter missing ID');
        }
        if (!chapter.title || chapter.title.trim() === '') {
          result.errors.push('Chapter missing title');
        }
        if (!chapter.storyText || chapter.storyText.trim() === '') {
          result.warnings.push(`Chapter ${chapter.id} missing story text`);
        }
      }
    }
  }

  private validateRewardsStructure(chain: QuestChain, result: ValidationResult): void {
    const { rewards } = chain;
    
    if (!rewards) {
      result.warnings.push('No rewards defined for quest chain');
      return;
    }

    // Validate completion rewards
    if (rewards.completion) {
      if (rewards.completion.xp < 0) {
        result.errors.push('Completion XP reward cannot be negative');
      }
      if (rewards.completion.coins < 0) {
        result.errors.push('Completion coin reward cannot be negative');
      }
    } else {
      result.warnings.push('No completion rewards defined');
    }

    // Validate milestone rewards
    if (rewards.milestones) {
      for (const milestone of rewards.milestones) {
        if (milestone.puzzleIndex < 0) {
          result.errors.push(`Invalid milestone puzzle index: ${milestone.puzzleIndex}`);
        }
        if (milestone.rewards.xp < 0) {
          result.errors.push(`Milestone XP reward cannot be negative for puzzle ${milestone.puzzleIndex}`);
        }
        if (milestone.rewards.coins < 0) {
          result.errors.push(`Milestone coin reward cannot be negative for puzzle ${milestone.puzzleIndex}`);
        }
      }
    }
  }

  async detectCircularDependencies(chainId: string, result: ValidationResult): Promise<void> {
    const chainPuzzles = await this.questChainPuzzleRepository.find({
      where: { questChainId: chainId },
    });

    const adjacencyList = new Map<string, string[]>();
    
    // Build adjacency list
    for (const chainPuzzle of chainPuzzles) {
      adjacencyList.set(chainPuzzle.puzzleId, []);
      
      // Add edges from unlock conditions
      if (chainPuzzle.unlockConditions?.previousPuzzles) {
        for (const prevPuzzleId of chainPuzzle.unlockConditions.previousPuzzles) {
          if (adjacencyList.has(prevPuzzleId)) {
            adjacencyList.get(prevPuzzleId)!.push(chainPuzzle.puzzleId);
          }
        }
      }
      
      // Add edges from branch conditions
      if (chainPuzzle.branchConditions) {
        for (const condition of chainPuzzle.branchConditions) {
          if (adjacencyList.has(condition.nextPuzzleId)) {
            adjacencyList.get(chainPuzzle.puzzleId)!.push(condition.nextPuzzleId);
          }
        }
      }
    }

    // Detect cycles using DFS
    const visited = new Set<string>();
    const recStack = new Set<string>();

    const hasCycle = (puzzleId: string): boolean => {
      if (recStack.has(puzzleId)) {
        return true; // Cycle detected
      }
      
      if (visited.has(puzzleId)) {
        return false;
      }

      visited.add(puzzleId);
      recStack.add(puzzleId);

      const neighbors = adjacencyList.get(puzzleId) || [];
      for (const neighbor of neighbors) {
        if (hasCycle(neighbor)) {
          result.errors.push(`Circular dependency detected involving puzzle: ${puzzleId}`);
          return true;
        }
      }

      recStack.delete(puzzleId);
      return false;
    };

    // Check each node
    for (const puzzleId of adjacencyList.keys()) {
      if (hasCycle(puzzleId)) {
        result.isValid = false;
        break;
      }
    }
  }
}