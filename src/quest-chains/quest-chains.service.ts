import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

import {
  QuestChain,
  QuestChainEntry,
  UserQuestChainProgress,
} from '@prisma/client';

import { CreateQuestChainDto } from './dto/create-quest-chain.dto';

@Injectable()
export class QuestChainsService {
  constructor(private readonly prisma: PrismaService) {}

  async createChain(dto: CreateQuestChainDto) {
    return this.prisma.questChain.create({
      data: {
        title: dto.title,
        description: dto.description,
        entries: {
          create: dto.entries.map((e, idx) => ({
            order: idx,
            puzzleId: e.puzzleId,
            unlockCondition: e.unlockCondition,
            nextEntries: e.nextEntries,
          })),
        },
      },
      include: { entries: true },
    });
  }

  async listChains(userId: string) {
    const chains = await this.prisma.questChain.findMany({
      include: { entries: true },
    });

    const progress = await this.prisma.userQuestChainProgress.findMany({
      where: { userId },
    });

    return chains.map((chain) => {
      const userProgress = progress.find((p) => p.chainId === chain.id);

      return {
        ...chain,
        completionStatus: userProgress
          ? userProgress.completedEntries.length
          : 0,
      };
    });
  }

  async getChainDetail(chainId: string, userId: string) {
    const chain = await this.prisma.questChain.findUnique({
      where: { id: chainId },
      include: { entries: true },
    });

    if (!chain) return null;

    const progress = await this.prisma.userQuestChainProgress.findUnique({
      where: {
        userId_chainId: {
          userId,
          chainId,
        },
      },
    });

    return chain.entries.map((entry) => ({
      ...entry,
      unlocked: this.isEntryUnlocked(entry, progress),
      completed: progress?.completedEntries.includes(entry.id) ?? false,
    }));
  }

  private isEntryUnlocked(
    entry: QuestChainEntry,
    progress?: UserQuestChainProgress,
  ) {
    if (!progress) return entry.order === 0; // first entry unlocked

    if (entry.unlockCondition === 'previous_completed') {
      return progress.completedEntries.includes(entry.id);
    }

    if (entry.unlockCondition?.startsWith('score')) {
      // Example: score>=80 (future implementation)
      return true;
    }

    return false;
  }

  async markEntryCompleted(
    userId: string,
    chainId: string,
    entryId: string,
  ) {
    const progress = await this.prisma.userQuestChainProgress.upsert({
      where: {
        userId_chainId: {
          userId,
          chainId,
        },
      },
      update: {
        completedEntries: {
          push: entryId,
        },
      },
      create: {
        userId,
        chainId,
        completedEntries: [entryId],
      },
    });

    const chain = await this.prisma.questChain.findUnique({
      where: { id: chainId },
      include: { entries: true },
    });

    if (chain && progress.completedEntries.length === chain.entries.length) {
      await this.emitChainCompleted(userId, chainId);
    }

    return progress;
  }

  private async emitChainCompleted(userId: string, chainId: string) {
    console.log(
      `Achievement triggered: User ${userId} completed chain ${chainId}`,
    );

    // integrate with Achievement System #15
  }
}