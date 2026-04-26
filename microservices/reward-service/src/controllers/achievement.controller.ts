import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { AchievementService } from '../services/achievement.service';
import { Achievement } from '../entities/achievement.entity';
import { UserAchievement } from '../entities/user-achievement.entity';

class CreateAchievementDto {
  name: string;
  description: string;
  category: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  points?: number;
  unlockConditions: any;
  prerequisites?: string[];
  metadata?: Record<string, any>;
}

class UnlockAchievementDto {
  userId: string;
  achievementId: string;
}

class UpdateProgressDto {
  userId: string;
  activityType: string;
  data: Record<string, any>;
}

@Controller('achievements')
export class AchievementController {
  private readonly logger = new Logger(AchievementController.name);

  constructor(private readonly achievementService: AchievementService) {}

  // ─── Achievement Management ───────────────────────────────────────────────────
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateAchievementDto): Promise<Achievement> {
    this.logger.log(`Creating achievement: ${dto.name}`);
    return this.achievementService.createAchievement(dto);
  }

  @Get()
  async getAll(): Promise<Achievement[]> {
    return this.achievementService.getAllAchievements();
  }

  @Get('category/:category')
  async getByCategory(
    @Param('category') category: string,
  ): Promise<Achievement[]> {
    return this.achievementService.getAchievementsByCategory(category);
  }

  @Get(':id')
  async getById(@Param('id') id: string): Promise<Achievement> {
    return this.achievementService.getAchievementById(id);
  }

  // ─── User Achievements ────────────────────────────────────────────────────────
  @Get('user/:userId')
  async getUserAchievements(
    @Param('userId') userId: string,
  ): Promise<(UserAchievement & { achievement: Achievement })[]> {
    return this.achievementService.getUserAchievements(userId);
  }

  @Post('unlock')
  @HttpCode(HttpStatus.OK)
  async unlock(@Body() dto: UnlockAchievementDto): Promise<UserAchievement> {
    this.logger.log(
      `Unlocking achievement ${dto.achievementId} for user ${dto.userId}`,
    );
    return this.achievementService.unlockAchievement(
      dto.userId,
      dto.achievementId,
    );
  }

  // ─── Progress Tracking ────────────────────────────────────────────────────────
  @Post('progress')
  @HttpCode(HttpStatus.OK)
  async updateProgress(
    @Body() dto: UpdateProgressDto,
  ): Promise<UserAchievement[]> {
    this.logger.log(
      `Updating progress for user ${dto.userId}: ${dto.activityType}`,
    );
    return this.achievementService.updateUserProgress(
      dto.userId,
      dto.activityType,
      dto.data,
    );
  }
}
