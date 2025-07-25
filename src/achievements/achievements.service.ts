import { Injectable } from '@nestjs/common';
import { CreateAchievementDto } from './dto/create-achievement.dto';
import { UpdateAchievementDto } from './dto/update-achievement.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Achievement } from './entities/achievement.entity';
import { UserAchievement } from './entities/user-achievement.entity';

@Injectable()
export class AchievementsService {
  constructor(
    @InjectRepository(Achievement)
    private achievementRepository: Repository<Achievement>,
    @InjectRepository(UserAchievement)
    private userAchievementRepository: Repository<UserAchievement>,
  ) {}

  create(createAchievementDto: CreateAchievementDto) {
    return 'This action adds a new achievement';
  }

  findAll() {
    return `This action returns all achievements`;
  }

  findOne(id: number) {
    return `This action returns a #${id} achievement`;
  }

  update(id: number, updateAchievementDto: UpdateAchievementDto) {
    return `This action updates a #${id} achievement`;
  }

  remove(id: number) {
    return `This action removes a #${id} achievement`;
  }

  async findLeaderboardAchievements(leaderboardId: number): Promise<Achievement[]> {
    return this.achievementRepository.find({
      where: {
        type: 'leaderboard',
        criteria: { leaderboardId },
      },
    });
  }

  async awardAchievementToUser(achievementId: number, userId: number): Promise<UserAchievement> {
    // Prevent duplicate awards
    const existing = await this.userAchievementRepository.findOne({
      where: {
        achievement: { id: achievementId },
        user: { id: userId },
      },
    });
    if (existing) return existing;
    const userAchievement = this.userAchievementRepository.create({
      achievement: { id: achievementId },
      user: { id: userId },
    });
    return this.userAchievementRepository.save(userAchievement);
  }
}
