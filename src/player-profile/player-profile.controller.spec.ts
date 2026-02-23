import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { PlayerProfileController } from './player-profile.controller';
import { PlayerProfileService } from './services/player-profile.service';
import { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

describe('PlayerProfileController', () => {
  let controller: PlayerProfileController;
  let service: PlayerProfileService;

  const mockUser = {
    id: 'user-1',
    username: 'testuser',
    email: 'test@example.com'
  };

  const mockProfile = {
    userId: 'user-1',
    username: 'testuser',
    avatarUrl: 'avatar.png',
    bio: 'Test bio',
    badges: ['first-win'],
    isProfilePublic: true,
    isOwner: true,
    statistics: {
      totalGamesPlayed: 100,
      totalWins: 75
    }
  };

  const mockRequest = {
    user: mockUser
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlayerProfileController],
      providers: [
        {
          provide: PlayerProfileService,
          useValue: {
            getProfile: jest.fn(),
            updateProfile: jest.fn(),
            uploadAvatar: jest.fn(),
            uploadBanner: jest.fn(),
            updateBadges: jest.fn(),
            updateStatistics: jest.fn(),
            getProfileStatistics: jest.fn(),
            searchProfiles: jest.fn(),
            getPublicProfiles: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<PlayerProfileController>(PlayerProfileController);
    service = module.get<PlayerProfileService>(PlayerProfileService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      jest.spyOn(service, 'getProfile').mockResolvedValue(mockProfile);

      const result = await controller.getProfile('user-1', mockRequest);

      expect(result).toEqual(mockProfile);
      expect(service.getProfile).toHaveBeenCalledWith('user-1', 'user-1');
    });

    it('should handle anonymous requests', async () => {
      const anonymousRequest = {} as RequestWithUser;
      jest.spyOn(service, 'getProfile').mockResolvedValue(mockProfile);

      await controller.getProfile('user-1', anonymousRequest);

      expect(service.getProfile).toHaveBeenCalledWith('user-1', undefined);
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const updateDto = { bio: 'Updated bio' };
      const updatedProfile = { ...mockProfile, bio: 'Updated bio' };
      
      jest.spyOn(service, 'updateProfile').mockResolvedValue(updatedProfile as any);

      const result = await controller.updateProfile(updateDto, mockRequest);

      expect(result.bio).toBe('Updated bio');
      expect(service.updateProfile).toHaveBeenCalledWith('user-1', updateDto);
    });
  });

  describe('uploadAvatar', () => {
    it('should upload avatar file', async () => {
      const mockFile = {
        mimetype: 'image/jpeg',
        size: 1024,
        originalname: 'avatar.jpg',
        buffer: Buffer.from('fake-data')
      } as any;

      jest.spyOn(service, 'uploadAvatar').mockResolvedValue('/uploads/avatar.jpg');

      const result = await controller.uploadAvatar(mockFile, mockRequest);

      expect(result.avatarUrl).toBe('/uploads/avatar.jpg');
      expect(service.uploadAvatar).toHaveBeenCalledWith('user-1', mockFile);
    });
  });

  describe('uploadBanner', () => {
    it('should upload banner file', async () => {
      const mockFile = {
        mimetype: 'image/jpeg',
        size: 2048,
        originalname: 'banner.jpg',
        buffer: Buffer.from('fake-data')
      } as any;

      jest.spyOn(service, 'uploadBanner').mockResolvedValue('/uploads/banner.jpg');

      const result = await controller.uploadBanner(mockFile, mockRequest);

      expect(result.bannerUrl).toBe('/uploads/banner.jpg');
      expect(service.uploadBanner).toHaveBeenCalledWith('user-1', mockFile);
    });
  });

  describe('updateBadges', () => {
    it('should update displayed badges', async () => {
      const updateDto = { displayedBadges: ['first-win', 'puzzle-master'] };
      const updatedProfile = { ...mockProfile, badges: ['first-win', 'puzzle-master'] };
      
      jest.spyOn(service, 'updateBadges').mockResolvedValue(updatedProfile as any);

      const result = await controller.updateBadges(updateDto, mockRequest);

      expect(result.badges).toEqual(['first-win', 'puzzle-master']);
      expect(service.updateBadges).toHaveBeenCalledWith('user-1', ['first-win', 'puzzle-master']);
    });
  });

  describe('updateStatistics', () => {
    it('should update profile statistics', async () => {
      const statsDto = { totalGamesPlayed: 150 };
      const updatedProfile = { 
        ...mockProfile, 
        statistics: { ...mockProfile.statistics, totalGamesPlayed: 150 } 
      };
      
      jest.spyOn(service, 'updateStatistics').mockResolvedValue(updatedProfile as any);

      const result = await controller.updateStatistics(statsDto, mockRequest);

      expect(result.statistics.totalGamesPlayed).toBe(150);
      expect(service.updateStatistics).toHaveBeenCalledWith('user-1', statsDto);
    });
  });

  describe('getStatistics', () => {
    it('should return statistics for profile owner', async () => {
      const stats = { totalGamesPlayed: 100, totalWins: 75 };
      
      jest.spyOn(service, 'getProfile').mockResolvedValue({ ...mockProfile, isOwner: true });
      jest.spyOn(service, 'getProfileStatistics').mockResolvedValue(stats);

      const result = await controller.getStatistics('user-1', mockRequest);

      expect(result).toEqual(stats);
    });

    it('should return statistics for public profile', async () => {
      const stats = { totalGamesPlayed: 100, totalWins: 75 };
      const publicProfile = { ...mockProfile, isOwner: false, statistics: stats };
      
      jest.spyOn(service, 'getProfile').mockResolvedValue(publicProfile);
      jest.spyOn(service, 'getProfileStatistics').mockResolvedValue(stats);

      const result = await controller.getStatistics('user-1', mockRequest);

      expect(result).toEqual(stats);
    });

    it('should throw ForbiddenException for private statistics', async () => {
      const privateProfile = { ...mockProfile, isOwner: false, statistics: undefined };
      
      jest.spyOn(service, 'getProfile').mockResolvedValue(privateProfile);

      await expect(controller.getStatistics('user-1', mockRequest))
        .rejects.toThrow(ForbiddenException);
    });
  });

  describe('searchProfiles', () => {
    it('should search profiles by query', async () => {
      const searchResults = [mockProfile];
      
      jest.spyOn(service, 'searchProfiles').mockResolvedValue(searchResults);

      const result = await controller.searchProfiles('test', 10);

      expect(result).toEqual(searchResults);
      expect(service.searchProfiles).toHaveBeenCalledWith('test', 10);
    });

    it('should use default limit', async () => {
      jest.spyOn(service, 'searchProfiles').mockResolvedValue([]);

      await controller.searchProfiles('test');

      expect(service.searchProfiles).toHaveBeenCalledWith('test', 20);
    });
  });

  describe('getPublicProfiles', () => {
    it('should return public profiles', async () => {
      const publicProfiles = [mockProfile];
      
      jest.spyOn(service, 'getPublicProfiles').mockResolvedValue(publicProfiles);

      const result = await controller.getPublicProfiles(25, 10);

      expect(result).toEqual(publicProfiles);
      expect(service.getPublicProfiles).toHaveBeenCalledWith(25, 10);
    });

    it('should use default parameters', async () => {
      jest.spyOn(service, 'getPublicProfiles').mockResolvedValue([]);

      await controller.getPublicProfiles();

      expect(service.getPublicProfiles).toHaveBeenCalledWith(50, 0);
    });
  });
});