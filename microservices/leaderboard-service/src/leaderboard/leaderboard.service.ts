import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import Redis from 'ioredis';
import { Leaderboard, LeaderboardCategory, TimePeriod } from './entities/leaderboard.entity';
import { Rank } from './entities/rank.entity';
import { Score } from './entities/score.entity';
import { UpdateScoreDto } from './dto/leaderboard.dto';

@Injectable()
export class LeaderboardService implements OnModuleInit, OnModuleDestroy {
  private redis: Redis;

  constructor(
    @InjectRepository(Leaderboard)
    private leaderboardRepo: Repository<Leaderboard>,
    @InjectRepository(Rank)
    private rankRepo: Repository<Rank>,
    @InjectRepository(Score)
    private scoreRepo: Repository<Score>,
  ) {}

  async onModuleInit() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    });
  }

  async onModuleDestroy() {
    await this.redis?.quit();
  }

  private getRedisKey(category: string, period: string): string {
    return `leaderboard:${category}:${period}`;
  }

  async updateScore(dto: UpdateScoreDto): Promise<Rank> {
    const { playerId, category, score } = dto;
    const period = TimePeriod.ALL_TIME;
    const redisKey = this.getRedisKey(category, period);

    // Update Redis sorted set
    await this.redis.zadd(redisKey, score, playerId);

    // Store in database
    const scoreRecord = this.scoreRepo.create({
      playerId,
      category,
      value: score,
      recordedAt: new Date(),
    });
    await this.scoreRepo.save(scoreRecord);

    // Recalculate ranks
    return this.recalculateRanks(category, period);
  }

  async recalculateRanks(category: LeaderboardCategory, period: TimePeriod): Promise<Rank> {
    const redisKey = this.getRedisKey(category, period);
    
    // Get all scores from Redis in descending order
    const scores = await this.redis.zrevrange(redisKey, 0, -1, 'WITHSCORES');
    
    let currentRank = 1;
    let lastPlayerId: string;

    for (let i = 0; i < scores.length; i += 2) {
      const playerId = scores[i];
      const score = parseInt(scores[i + 1]);

      // Find or create rank record
      let rank = await this.rankRepo.findOne({
        where: { playerId, leaderboard: { category, timePeriod: period } },
        relations: ['leaderboard'],
      });

      if (!rank) {
        const leaderboard = await this.getOrCreateLeaderboard(category, period);
        rank = this.rankRepo.create({
          playerId,
          leaderboardId: leaderboard.id,
          score,
          rank: currentRank,
          lastUpdated: new Date(),
        });
      } else {
        rank.score = score;
        rank.rank = currentRank;
        rank.lastUpdated = new Date();
      }

      await this.rankRepo.save(rank);
      lastPlayerId = playerId;
      currentRank++;
    }

    return lastPlayerId 
      ? await this.rankRepo.findOne({ 
          where: { playerId: lastPlayerId, leaderboard: { category, timePeriod: period } },
          relations: ['leaderboard'],
        })
      : null;
  }

  private async getOrCreateLeaderboard(category: LeaderboardCategory, period: TimePeriod): Promise<Leaderboard> {
    let leaderboard = await this.leaderboardRepo.findOne({
      where: { category, timePeriod: period },
    });

    if (!leaderboard) {
      leaderboard = this.leaderboardRepo.create({
        name: `${category} - ${period}`,
        category,
        timePeriod: period,
        isActive: true,
      });
      await this.leaderboardRepo.save(leaderboard);
    }

    return leaderboard;
  }

  async getLeaderboard(
    category: LeaderboardCategory,
    period: TimePeriod,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: Rank[]; total: number }> {
    const redisKey = this.getRedisKey(category, period);
    const offset = (page - 1) * limit;

    // Try Redis first
    const cached = await this.redis.zrevrange(redisKey, offset, offset + limit - 1, 'WITHSCORES');
    
    if (cached.length > 0) {
      const data: Rank[] = [];
      for (let i = 0; i < cached.length; i += 2) {
        const playerId = cached[i];
        const score = parseInt(cached[i + 1]);
        
        const rank = await this.rankRepo.findOne({
          where: { playerId, leaderboard: { category, timePeriod: period } },
          relations: ['leaderboard'],
        });
        
        if (rank) data.push(rank);
      }
      
      const total = await this.redis.zcard(redisKey);
      return { data, total };
    }

    // Fallback to database
    const [data, total] = await this.rankRepo.findAndCount({
      where: { leaderboard: { category, timePeriod: period } },
      relations: ['leaderboard'],
      order: { rank: 'ASC' },
      skip: offset,
      take: limit,
    });

    return { data, total };
  }

  async getPlayerRank(
    playerId: string,
    category?: LeaderboardCategory,
    period: TimePeriod = TimePeriod.ALL_TIME,
  ): Promise<Rank | null> {
    if (category) {
      const redisKey = this.getRedisKey(category, period);
      const rank = await this.redis.zrevrank(redisKey, playerId);
      
      if (rank !== null) {
        const score = await this.redis.zscore(redisKey, playerId);
        return {
          id: '',
          playerId,
          leaderboardId: '',
          rank: rank + 1,
          score: parseInt(score),
          lastUpdated: new Date(),
          createdAt: new Date(),
        } as Rank;
      }
      
      return this.rankRepo.findOne({
        where: { playerId, leaderboard: { category, timePeriod: period } },
        relations: ['leaderboard'],
      });
    }

    // Return rank for each category
    return null;
  }

  async resetLeaderboard(period: TimePeriod): Promise<void> {
    const categories = Object.values(LeaderboardCategory);
    
    for (const category of categories) {
      const redisKey = this.getRedisKey(category, period);
      await this.redis.del(redisKey);
      
      await this.rankRepo.delete({
        leaderboard: { category, timePeriod: period },
      });
    }
  }

  // Cron job for daily leaderboard reset at midnight
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyReset() {
    console.log('Running daily leaderboard reset...');
    await this.resetLeaderboard(TimePeriod.DAILY);
  }

  // Cron job for weekly leaderboard reset on Sunday at midnight
  @Cron('0 0 * * 0')
  async handleWeeklyReset() {
    console.log('Running weekly leaderboard reset...');
    await this.resetLeaderboard(TimePeriod.WEEKLY);
  }
}