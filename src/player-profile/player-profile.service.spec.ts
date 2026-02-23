import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PlayerProfileService } from './services/player-profile.service';
import { PlayerProfile } from './entities/player-profile.entity';
import { User } from '../users/entities/user.entity';

describe('PlayerProfileService', () => {
  let service: PlayerProfileService;
  let profileRepo: Repository<PlayerProfile>;
  let userRepo: Repository<User>;

  const mockUser = {
    id: 'user-1',
    username: 'testuser',
    email: 'test@example.com',
    avatar: 'default-avatar.png'
  };

  const mockProfile = {
    id: 'profile-1',
    userId: 'user-1',
    avatarUrl: 'custom-avatar.png',
    bannerTheme: 'cosmic',
    bio: 'Test bio',
    badges: ['first-win', 'puzzle-master'],
    privacySettings: {
      isProfilePublic: true,
      showBadges: true,
      showBio: true,
      showStats: true,
      showSocialLinks: true,
      showLocation: true,
      showWebsite: true
    },
    statistics: {
      totalGamesPlayed: 100,
      totalWins: 75,
      winRate: 0.75
    }
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlayerProfileService,
        {
          provide: getRepositoryToken(PlayerProfile),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PlayerProfileService>(PlayerProfileService);
    profileRepo = module.get<Repository<PlayerProfile>>(getRepositoryToken(PlayerProfile));
    userRepo = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getProfile', () => {
    it('should return public profile for any viewer', async () => {
      jest.spyOn(userRepo, 'findOne').mockResolvedValue(mockUser as User);
      jest.spyOn(profileRepo, 'findOne').mockResolvedValue(mockProfile as PlayerProfile);

      const result = await service.getProfile('user-1', 'viewer-1');

      expect(result).toMatchObject({
        userId: 'user-1',
        username: 'testuser',
        avatarUrl: 'custom-avatar.png',
        bio: 'Test bio',
        badges: ['first-win', 'puzzle-master'],
        isProfilePublic: true
      });
    });

    it('should return full profile for owner', async () => {
      jest.spyOn(userRepo, 'findOne').mockResolvedValue(mockUser as User);
      jest.spyOn(profileRepo, 'findOne').mockResolvedValue(mockProfile as PlayerProfile);

      const result = await service.getProfile('user-1', 'user-1');

      expect(result.isOwner).toBe(true);
      expect(result.statistics).toBeDefined();
    });

    it('should throw NotFoundException for non-existent user', async () => {
      jest.spyOn(userRepo, 'findOne').mockResolvedValue(null);

      await expect(service.getProfile('non-existent', 'viewer-1'))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for private profile', async () => {
      const privateProfile = {
        ...mockProfile,
        privacySettings: { ...mockProfile.privacySettings, isProfilePublic: false }
      };

      jest.spyOn(userRepo, 'findOne').mockResolvedValue(mockUser as User);
      jest.spyOn(profileRepo, 'findOne').mockResolvedValue(privateProfile as PlayerProfile);

      await expect(service.getProfile('user-1', 'viewer-1'))
        .rejects.toThrow(ForbiddenException);
    });

    it('should respect privacy settings for bio', async () => {
      const profileWithPrivateBio = {
        ...mockProfile,
        privacySettings: { ...mockProfile.privacySettings, showBio: false }
      };

      jest.spyOn(userRepo, 'findOne').mockResolvedValue(mockUser as User);
      jest.spyOn(profileRepo, 'findOne').mockResolvedValue(profileWithPrivateBio as PlayerProfile);

      const result = await service.getProfile('user-1', 'viewer-1');

      expect(result.bio).toBeUndefined();
    });
  });

  describe('updateProfile', () => {
    it('should create new profile if none exists', async () => {
      jest.spyOn(profileRepo, 'findOne').mockResolvedValue(null);
      jest.spyOn(profileRepo, 'create').mockReturnValue(mockProfile as PlayerProfile);
      jest.spyOn(profileRepo, 'save').mockResolvedValue(mockProfile as PlayerProfile);

      const updateDto = { bio: 'Updated bio' };
      const result = await service.updateProfile('user-1', updateDto);

      expect(profileRepo.create).toHaveBeenCalledWith({ userId: 'user-1' });
      expect(result.bio).toBe('Updated bio');
    });

    it('should update existing profile', async () => {
      const existingProfile = { ...mockProfile };
      jest.spyOn(profileRepo, 'findOne').mockResolvedValue(existingProfile as PlayerProfile);
      jest.spyOn(profileRepo, 'save').mockResolvedValue({
        ...existingProfile,
        bio: 'Updated bio'
      } as PlayerProfile);

      const updateDto = { bio: 'Updated bio' };
      const result = await service.updateProfile('user-1', updateDto);

      expect(result.bio).toBe('Updated bio');
    });

    it('should merge privacy settings', async () => {
      const existingProfile = { ...mockProfile };
      jest.spyOn(profileRepo, 'findOne').mockResolvedValue(existingProfile as PlayerProfile);
      jest.spyOn(profileRepo, 'save').mockResolvedValue({
        ...existingProfile,
        privacySettings: {
          ...existingProfile.privacySettings,
          showBio: false
        }
      } as PlayerProfile);

      const updateDto = { privacySettings: { showBio: false } };
      const result = await service.updateProfile('user-1', updateDto);

      expect(result.privacySettings.showBio).toBe(false);
      expect(result.privacySettings.isProfilePublic).toBe(true); // Should preserve existing
    });
  });

  describe('uploadAvatar', () => {
    const mockFile = {
      mimetype: 'image/jpeg',
      size: 1024 * 1024, // 1MB
      originalname: 'avatar.jpg',
      buffer: Buffer.from('fake-image-data')
    } as any;

    it('should upload valid avatar file', async () => {
      jest.spyOn(profileRepo, 'findOne').mockResolvedValue(mockProfile as PlayerProfile);
      jest.spyOn(profileRepo, 'save').mockResolvedValue(mockProfile as PlayerProfile);

      // Mock fs operations
      const fs = require('fs');
      jest.spyOn(fs.promises, 'mkdir').mockResolvedValue(undefined);
      jest.spyOn(fs.promises, 'writeFile').mockResolvedValue(undefined);

      const result = await service.uploadAvatar('user-1', mockFile);

      expect(result).toMatch(/uploads\/avatars\/avatar-user-1-\d+\.jpg/);
    });

    it('should reject invalid file type', async () => {
      const invalidFile = { ...mockFile, mimetype: 'text/plain' };

      await expect(service.uploadAvatar('user-1', invalidFile))
        .rejects.toThrow(BadRequestException);
    });

    it('should reject oversized file', async () => {
      const largeFile = { ...mockFile, size: 10 * 1024 * 1024 }; // 10MB

      await expect(service.uploadAvatar('user-1', largeFile))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('updateBadges', () => {
    it('should update displayed badges', async () => {
      jest.spyOn(profileRepo, 'findOne').mockResolvedValue(mockProfile as PlayerProfile);
      jest.spyOn(profileRepo, 'save').mockResolvedValue({
        ...mockProfile,
        badges: ['new-badge', 'another-badge']
      } as PlayerProfile);

      const result = await service.updateBadges('user-1', ['new-badge', 'another-badge']);

      expect(result.badges).toEqual(['new-badge', 'another-badge']);
    });

    it('should filter out invalid badge IDs', async () => {
      jest.spyOn(profileRepo, 'findOne').mockResolvedValue(mockProfile as PlayerProfile);
      jest.spyOn(profileRepo, 'save').mockResolvedValue({
        ...mockProfile,
        badges: ['valid-badge']
      } as PlayerProfile);

      const result = await service.updateBadges('user-1', ['valid-badge', '', null as any]);

      expect(result.badges).toEqual(['valid-badge']);
    });
  });

  describe('updateStatistics', () => {
    it('should update profile statistics', async () => {
      jest.spyOn(profileRepo, 'findOne').mockResolvedValue(mockProfile as PlayerProfile);
      jest.spyOn(profileRepo, 'save').mockResolvedValue({
        ...mockProfile,
        statistics: {
          ...mockProfile.statistics,
          totalGamesPlayed: 150
        }
      } as PlayerProfile);

      const stats = { totalGamesPlayed: 150 };
      const result = await service.updateStatistics('user-1', stats);

      expect(result.statistics.totalGamesPlayed).toBe(150);
    });

    it('should create profile if none exists', async () => {
      jest.spyOn(profileRepo, 'findOne').mockResolvedValue(null);
      jest.spyOn(profileRepo, 'create').mockReturnValue({
        userId: 'user-1',
        statistics: { totalGamesPlayed: 1 }
      } as PlayerProfile);
      jest.spyOn(profileRepo, 'save').mockResolvedValue({
        userId: 'user-1',
        statistics: { totalGamesPlayed: 1 }
      } as PlayerProfile);

      const stats = { totalGamesPlayed: 1 };
      const result = await service.updateStatistics('user-1', stats);

      expect(result.statistics.totalGamesPlayed).toBe(1);
    });
  });

  describe('searchProfiles', () => {
    it('should search public profiles by username', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockUser])
      };

      jest.spyOn(userRepo, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);
      jest.spyOn(service, 'getProfile').mockResolvedValue({
        userId: 'user-1',
        username: 'testuser',
        isProfilePublic: true
      } as any);

      const result = await service.searchProfiles('test', 10);

      expect(result).toHaveLength(1);
      expect(result[0].username).toBe('testuser');
    });
  });
});