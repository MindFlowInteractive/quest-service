import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlayerProfile } from '../entities/player-profile.entity';
import { User } from '../../users/entities/user.entity';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { ProfileResponseDto } from '../dto/profile-response.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PlayerProfileService {
  constructor(
    @InjectRepository(PlayerProfile)
    private profileRepo: Repository<PlayerProfile>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async getProfile(userId: string, viewerId?: string): Promise<ProfileResponseDto> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const profile = await this.profileRepo.findOne({ where: { userId } });
    const isOwner = viewerId === userId;
    const privacy = profile?.privacySettings || { isProfilePublic: true, showBadges: true, showBio: true };

    if (!isOwner && !privacy.isProfilePublic) {
      throw new ForbiddenException('Profile is private');
    }

    const response: ProfileResponseDto = {
      userId: user.id,
      username: user.username,
      avatarUrl: profile?.avatarUrl || user.avatar,
      bannerTheme: profile?.bannerTheme,
      bio: isOwner || privacy.showBio ? profile?.bio || user.profile?.bio : undefined,
      badges: isOwner || privacy.showBadges ? profile?.badges || [] : undefined,
      isProfilePublic: privacy.isProfilePublic,
    };

    return response;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<PlayerProfile> {
    let profile = await this.profileRepo.findOne({ where: { userId } });
    if (!profile) {
      profile = this.profileRepo.create({ userId });
    }

    if (dto.avatarUrl !== undefined) profile.avatarUrl = dto.avatarUrl;
    if (dto.bannerTheme !== undefined) profile.bannerTheme = dto.bannerTheme;
    if (dto.bio !== undefined) profile.bio = dto.bio;
    if (dto.privacySettings) {
      profile.privacySettings = { ...profile.privacySettings, ...dto.privacySettings };
    }

    return this.profileRepo.save(profile);
  }

  async uploadAvatar(userId: string, file: Express.Multer.File): Promise<string> {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type');
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('File too large');
    }

    const ext = path.extname(file.originalname);
    const filename = `${userId}-${Date.now()}${ext}`;
    const uploadPath = path.join('uploads', 'avatars', filename);

    await fs.promises.mkdir(path.dirname(uploadPath), { recursive: true });
    await fs.promises.writeFile(uploadPath, file.buffer);

    await this.updateProfile(userId, { avatarUrl: uploadPath });
    return uploadPath;
  }
}