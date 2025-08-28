
import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { AchievementsService } from './achievements.service';
import { CreateAchievementDto } from './dto/create-achievement.dto';
import { UpdateAchievementDto } from './dto/update-achievement.dto';

@Controller('achievements')
export class AchievementsController {
  constructor(private readonly achievementsService: AchievementsService) {}

  @Post()
  create(@Body() createAchievementDto: CreateAchievementDto) {
    return this.achievementsService.create(createAchievementDto);
  }

  @Get()
  findAll() {
    return this.achievementsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.achievementsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAchievementDto: UpdateAchievementDto) {
    return this.achievementsService.update(id, updateAchievementDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.achievementsService.remove(id);
  }

  // --- Achievement Progress & Unlocking ---

  @Get('user/:userId')
  getUserAchievements(@Param('userId') userId: string) {
    return this.achievementsService.getUserAchievements(userId);
  }

  @Post('user/:userId/unlock/:achievementId')
  tryUnlockAchievement(@Param('userId') userId: string, @Param('achievementId') achievementId: string, @Body() userContext: any) {
    return this.achievementsService.tryUnlockAchievement(userId, achievementId, userContext);
  }

  @Post('user/:userId/progress/:achievementId')
  updateProgress(@Param('userId') userId: string, @Param('achievementId') achievementId: string, @Body('progressDelta') progressDelta: number, @Body('context') context: any) {
    return this.achievementsService.updateProgress(userId, achievementId, progressDelta, context);
  }

  // --- Analytics ---

  @Get('analytics')
  getAnalytics() {
    return this.achievementsService.getAchievementAnalytics();
  }

  // --- Social Sharing ---

  @Get('user/:userId/share/:achievementId')
  shareAchievement(@Param('userId') userId: string, @Param('achievementId') achievementId: string) {
    return this.achievementsService.shareAchievement(userId, achievementId);
  }

  // --- Content Unlocking ---

  @Get('user/:userId/unlocked-content')
  getUnlockedContent(@Param('userId') userId: string) {
    return this.achievementsService.getUnlockedContent(userId);
  }

  // --- Retroactive Unlock ---

  @Post('user/:userId/retroactive')
  retroactiveUnlock(@Param('userId') userId: string, @Body() userContext: any) {
    return this.achievementsService.retroactiveUnlock(userId, userContext);
  }
}
