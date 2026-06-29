import { Injectable } from '@nestjs/common';

@Injectable()
export class PrismaService {
  questChain = {
    create: async (...args: any[]) => args[0]?.data,
    findMany: async (..._args: any[]) => [],
    findUnique: async (..._args: any[]) => null,
  };

  userQuestChainProgress = {
    findMany: async (..._args: any[]) => [],
    findUnique: async (..._args: any[]) => null,
    upsert: async (args: any) => ({
      userId: args.create.userId,
      chainId: args.create.chainId,
      completedEntries: args.create.completedEntries,
    }),
  };
}