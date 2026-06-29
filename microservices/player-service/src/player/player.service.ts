import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Player } from './entities/player.entity';
import { PlayerProfile } from './entities/player-profile.entity';
import { PlayerProgress } from './entities/player-progress.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { TrackProgressDto } from './dto/track-progress.dto';

@Injectable()
export class PlayerService {
  constructor(
    @InjectRepository(Player)
    private readonly playerRepo: Repository<Player>,
    @InjectRepository(PlayerProfile)
    private readonly profileRepo: Repository<PlayerProfile>,
    @InjectRepository(PlayerProgress)
    private readonly progressRepo: Repository<PlayerProgress>,
  ) {}

  async findOne(id: string): Promise<Player> {
    const player = await this.playerRepo.findOne({
      where: { id, isActive: true },
      relations: ['profile'],
    });

    if (!player) {
      throw new NotFoundException(`Player with ID ${id} not found`);
    }

    return player;
  }

  async findByEmail(email: string): Promise<Player> {
    const player = await this.playerRepo.findOne({
      where: { email, isActive: true },
      relations: ['profile'],
    });

    if (!player) {
      throw new NotFoundException(`Player with email ${email} not found`);
    }

    return player;
  }

  async updateProfile(playerId: string, updateProfileDto: UpdateProfileDto): Promise<PlayerProfile> {
    const player = await this.findOne(playerId);

    if (!player.profile) {
      // Create profile if it doesn't exist
      const profile = this.profileRepo.create({
        player,
        ...updateProfileDto,
      });
      return this.profileRepo.save(profile);
    }

    // Update existing profile
    Object.assign(player.profile, updateProfileDto);
    return this.profileRepo.save(player.profile);
  }

  async getProfile(playerId: string): Promise<PlayerProfile> {
    const player = await this.findOne(playerId);

    if (!player.profile) {
      throw new NotFoundException('Profile not found');
    }

    return player.profile;
  }

  async trackProgress(playerId: string, trackProgressDto: TrackProgressDto): Promise<PlayerProgress> {
    const player = await this.findOne(playerId);

    const progress = this.progressRepo.create({
      player,
      ...trackProgressDto,
    });

    return this.progressRepo.save(progress);
  }

  async getProgressHistory(playerId: string): Promise<PlayerProgress[]> {
    const player = await this.findOne(playerId);

    return this.progressRepo.find({
      where: { player: { id: playerId } },
      order: { createdAt: 'DESC' },
    });
  }

  async getStatistics(playerId: string): Promise<any> {
    const player = await this.findOne(playerId);

    const progressStats = await this.progressRepo
      .createQueryBuilder('progress')
      .select('COUNT(*)', 'totalProgress')
      .addSelect('SUM(progress.points)', 'totalPoints')
      .where('progress.playerId = :playerId', { playerId })
      .getRawOne();

    return {
      playerId,
      totalProgress: parseInt(progressStats.totalProgress || '0'),
      totalPoints: parseInt(progressStats.totalPoints || '0'),
      profile: player.profile,
    };
  }

  async deactivatePlayer(playerId: string): Promise<void> {
    const player = await this.findOne(playerId);
    player.isActive = false;
    await this.playerRepo.save(player);
  }
}