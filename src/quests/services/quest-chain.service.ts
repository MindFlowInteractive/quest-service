import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

import { QuestChain } from '../entities/quest-chain.entity';
import { QuestChainPuzzle } from '../entities/quest-chain-puzzle.entity';
import { CreateQuestChainDto } from '../dto/create-quest-chain.dto';
import { UpdateQuestChainDto } from '../dto/update-quest-chain.dto';
import { AddPuzzleToChainDto } from '../dto/add-puzzle-to-chain.dto';
import { GetQuestChainsDto } from '../dto/get-quest-chains.dto';

@Injectable()
export class QuestChainService {
  constructor(
    @InjectRepository(QuestChain)
    private readonly questChainRepository: Repository<QuestChain>,
    @InjectRepository(QuestChainPuzzle)
    private readonly questChainPuzzleRepository: Repository<QuestChainPuzzle>,
  ) {}

  async createChain(chainData: CreateQuestChainDto): Promise<QuestChain> {
    try {
      const chain = this.questChainRepository.create({
        ...chainData,
        id: uuidv4(),
      });

      return await this.questChainRepository.save(chain);
    } catch (error) {
      throw new BadRequestException(`Failed to create quest chain: ${error.message}`);
    }
  }

  async getChainById(id: string): Promise<QuestChain> {
    const chain = await this.questChainRepository.findOne({
      where: { id },
      relations: ['chainPuzzles', 'chainPuzzles.puzzle'],
    });

    if (!chain) {
      throw new NotFoundException(`Quest chain with ID ${id} not found`);
    }

    return chain;
  }

  async getChains(query: GetQuestChainsDto): Promise<QuestChain[]> {
    const { status, limit = 10, offset = 0, sortBy = 'createdAt', sortOrder = 'DESC' } = query;

    const qb = this.questChainRepository.createQueryBuilder('questChain');

    if (status && status !== 'all') {
      qb.andWhere('questChain.status = :status', { status });
    }

    qb.orderBy(`questChain.${sortBy}`, sortOrder)
      .skip(offset)
      .take(limit);

    return await qb.getMany();
  }

  async updateChain(id: string, updateData: UpdateQuestChainDto): Promise<QuestChain> {
    const chain = await this.getChainById(id);

    Object.assign(chain, updateData);

    try {
      return await this.questChainRepository.save(chain);
    } catch (error) {
      throw new BadRequestException(`Failed to update quest chain: ${error.message}`);
    }
  }

  async deleteChain(id: string): Promise<void> {
    const chain = await this.getChainById(id);

    try {
      await this.questChainRepository.remove(chain);
    } catch (error) {
      throw new BadRequestException(`Failed to delete quest chain: ${error.message}`);
    }
  }

  async addPuzzleToChain(chainId: string, puzzleData: AddPuzzleToChainDto): Promise<QuestChainPuzzle> {
    const chain = await this.getChainById(chainId);

    // Check if puzzle already exists in this chain
    const existingChainPuzzle = await this.questChainPuzzleRepository.findOne({
      where: {
        questChainId: chainId,
        puzzleId: puzzleData.puzzleId,
      },
    });

    if (existingChainPuzzle) {
      throw new BadRequestException('Puzzle already exists in this quest chain');
    }

    try {
      const chainPuzzle = this.questChainPuzzleRepository.create({
        ...puzzleData,
        questChainId: chainId,
        id: uuidv4(),
      });

      return await this.questChainPuzzleRepository.save(chainPuzzle);
    } catch (error) {
      throw new BadRequestException(`Failed to add puzzle to chain: ${error.message}`);
    }
  }

  async removePuzzleFromChain(chainId: string, puzzleId: string): Promise<void> {
    const chainPuzzle = await this.questChainPuzzleRepository.findOne({
      where: {
        questChainId: chainId,
        puzzleId: puzzleId,
      },
    });

    if (!chainPuzzle) {
      throw new NotFoundException('Puzzle not found in this quest chain');
    }

    try {
      await this.questChainPuzzleRepository.remove(chainPuzzle);
    } catch (error) {
      throw new BadRequestException(`Failed to remove puzzle from chain: ${error.message}`);
    }
  }

  async getChainPuzzles(chainId: string): Promise<QuestChainPuzzle[]> {
    const chain = await this.getChainById(chainId);

    return await this.questChainPuzzleRepository.find({
      where: { questChainId: chainId },
      order: { sequenceOrder: 'ASC' },
      relations: ['puzzle'],
    });
  }

  async validateChainStructure(chainId: string): Promise<boolean> {
    const chainPuzzles = await this.getChainPuzzles(chainId);

    // Check for sequential order gaps
    const sequenceOrders = chainPuzzles.map(cp => cp.sequenceOrder).sort((a, b) => a - b);
    
    for (let i = 0; i < sequenceOrders.length - 1; i++) {
      if (sequenceOrders[i + 1] - sequenceOrders[i] > 1) {
        return false;
      }
    }

    // Check unlock conditions reference valid puzzles
    for (const chainPuzzle of chainPuzzles) {
      for (const prevPuzzleId of chainPuzzle.unlockConditions.previousPuzzles || []) {
        const exists = chainPuzzles.some(cp => cp.puzzleId === prevPuzzleId);
        if (!exists) {
          return false;
        }
      }
    }

    return true;
  }
}