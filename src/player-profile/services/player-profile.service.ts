import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlayerProfile } from '../entities/player-profile.entity';
import { User } from '../../users/entities/user.entity';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { ProfileResponseDto } from '../dto/profile-response.dto';
import { ProfileStatisticsDto } from '../dto/profile-statistics.dto';
import * as fs from 'fs';
import * as path from 'path';

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

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
    const privacy = profile?.privacySettings || {
      isProfilePublic: true,
      showBadges: true,
      showBio: true,
      showStats: true,
      showSocialLinks: true,
      showLocation: true,
      showWebsite: true
    };

    if (!isOwner && !privacy.isProfilePublic) {
      throw new ForbiddenException('Profile is private');
    }

    const response: ProfileResponseDto = {
      userId: user.id,
      username: user.username,
      avatarUrl: profile?.avatarUrl || user.avatar,
      bannerTheme: profile?.bannerTheme,
      bannerUrl: profile?.bannerUrl,
      bio: isOwner || privacy.showBio ? profile?.bio : undefined,
      title: profile?.title,
      location: isOwner || privacy.showLocation ? profile?.location : undefined,
      website: isOwner || privacy.showWebsite ? profile?.website : undefined,
      badges: isOwner || privacy.showBadges ? profile?.badges || [] : undefined,
      customFields: isOwner ? profile?.customFields || {} : undefined,
      socialLinks: isOwner || privacy.showSocialLinks ? profile?.socialLinks || {} : undefined,
      displayPreferences: isOwner ? profile?.displayPreferences || {} : undefined,
      statistics: isOwner || privacy.showStats ? profile?.statistics || {} : undefined,
      isProfilePublic: privacy.isProfilePublic,
      isOwner,
    };

    return response;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<PlayerProfile> {
    let profile = await this.profileRepo.findOne({ where: { userId } });
    if (!profile) {
      profile = this.profileRepo.create({ userId });
    }

    // Update basic fields
    if (dto.avatarUrl !== undefined) profile.avatarUrl = dto.avatarUrl;
    if (dto.bannerTheme !== undefined) profile.bannerTheme = dto.bannerTheme;
    if (dto.bannerUrl !== undefined) profile.bannerUrl = dto.bannerUrl;
    if (dto.bio !== undefined) profile.bio = dto.bio;
    if (dto.title !== undefined) profile.title = dto.title;
    if (dto.location !== undefined) profile.location = dto.location;
    if (dto.website !== undefined) profile.website = dto.website;
    if (dto.badges !== undefined) profile.badges = dto.badges;
    if (dto.customFields !== undefined) profile.customFields = dto.customFields;
    if (dto.socialLinks !== undefined) profile.socialLinks = dto.socialLinks;
    if (dto.displayPreferences !== undefined) {
      profile.displayPreferences = { ...profile.displayPreferences, ...dto.displayPreferences };
    }
    if (dto.privacySettings) {
      profile.privacySettings = { ...profile.privacySettings, ...dto.privacySettings };
    }

    return this.profileRepo.save(profile);
  }

  async uploadAvatar(userId: string, file: MulterFile): Promise<string> {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Allowed: JPEG, PNG, GIF, WebP');
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('File too large. Maximum size: 5MB');
    }

    const ext = path.extname(file.originalname);
    const filename = `avatar-${userId}-${Date.now()}${ext}`;
    const uploadPath = path.join('uploads', 'avatars', filename);

    await fs.promises.mkdir(path.dirname(uploadPath), { recursive: true });
    await fs.promises.writeFile(uploadPath, file.buffer);

    await this.updateProfile(userId, { avatarUrl: uploadPath });
    return uploadPath;
  }

  async uploadBanner(userId: string, file: MulterFile): Promise<string> {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Allowed: JPEG, PNG, GIF, WebP');
    }

    const maxSize = 10 * 1024 * 1024; // 10MB for banners
    if (file.size > maxSize) {
      throw new BadRequestException('File too large. Maximum size: 10MB');
    }

    const ext = path.extname(file.originalname);
    const filename = `banner-${userId}-${Date.now()}${ext}`;
    const uploadPath = path.join('uploads', 'banners', filename);

    await fs.promises.mkdir(path.dirname(uploadPath), { recursive: true });
    await fs.promises.writeFile(uploadPath, file.buffer);

    await this.updateProfile(userId, { bannerUrl: uploadPath });
    return uploadPath;
  }

  async updateBadges(userId: string, badgeIds: string[]): Promise<PlayerProfile> {
    // Validate badge IDs exist (this would typically check against a badges service)
    const validBadgeIds = badgeIds.filter(id => id && typeof id === 'string');

    return this.updateProfile(userId, { badges: validBadgeIds });
  }

  async updateStatistics(userId: string, stats: Partial<ProfileStatisticsDto>): Promise<PlayerProfile> {
    let profile = await this.profileRepo.findOne({ where: { userId } });
    if (!profile) {
      profile = this.profileRepo.create({ userId });
    }

    profile.statistics = { ...profile.statistics, ...stats };
    return this.profileRepo.save(profile);
  }

  async getProfileStatistics(userId: string): Promise<any> {
    const profile = await this.profileRepo.findOne({ where: { userId } });
    return profile?.statistics || {};
  }

  async searchProfiles(query: string, limit: number = 20): Promise<ProfileResponseDto[]> {
    const users = await this.userRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.profile', 'profile')
      .where('user.username ILIKE :query', { query: `%${query}%` })
      .andWhere('profile.privacySettings->>\'isProfilePublic\' = \'true\' OR profile.privacySettings IS NULL')
      .limit(limit)
      .getMany();

    return Promise.all(
      users.map(user => this.getProfile(user.id))
    );
  }

  async getPublicProfiles(limit: number = 50, offset: number = 0): Promise<ProfileResponseDto[]> {
    const profiles = await this.profileRepo
      .createQueryBuilder('profile')
      .leftJoinAndSelect('profile.user', 'user')
      .where('profile.privacySettings->>\'isProfilePublic\' = \'true\'')
      .orderBy('profile.updatedAt', 'DESC')
      .limit(limit)
      .offset(offset)
      .getMany();

    return Promise.all(
      profiles.map(profile => this.getProfile(profile.userId))
    );
  }
}
