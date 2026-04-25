import { Test, TestingModule } from '@nestjs/testing';
import { GuildsController } from './guilds.controller';
import { GuildsService } from './guilds.service';
import { CreateGuildDto } from './dto/create-guild.dto';
import { JoinGuildDto } from './dto/join-guild.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { GuildResponseDto, GuildLeaderboardResponseDto, GuildMemberResponseDto } from './dto/guild-response.dto';

describe('GuildsController', () => {
  let controller: GuildsController;
  let service: GuildsService;

  const mockGuildResponse: GuildResponseDto = {
    id: 'guild-1',
    name: 'Test Guild',
    tag: 'TEST',
    description: 'A test guild',
    ownerId: 'user-1',
    maxMembers: 20,
    aggregateScore: 0,
    memberCount: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    members: [
      {
        id: 'member-1',
        playerId: 'user-1',
        role: 'owner',
        joinedAt: new Date(),
      },
    ],
  };

  const mockLeaderboardResponse: GuildLeaderboardResponseDto = {
    entries: [
      {
        rank: 1,
        guildId: 'guild-1',
        guildName: 'Test Guild',
        guildTag: 'TEST',
        aggregateScore: 100,
        memberCount: 5,
      },
    ],
    lastResetAt: new Date(),
    nextResetAt: new Date(),
  };

  const mockMemberResponse: GuildMemberResponseDto = {
    id: 'member-1',
    playerId: 'user-2',
    role: 'officer',
    joinedAt: new Date(),
  };

  beforeEach(async () => {
    const mockGuildsService = {
      createGuild: jest.fn().mockResolvedValue(mockGuildResponse),
      joinGuild: jest.fn().mockResolvedValue(mockGuildResponse),
      leaveGuild: jest.fn().mockResolvedValue(undefined),
      kickMember: jest.fn().mockResolvedValue(undefined),
      updateMemberRole: jest.fn().mockResolvedValue(mockMemberResponse),
      getGuildProfile: jest.fn().mockResolvedValue(mockGuildResponse),
      getGuildLeaderboard: jest.fn().mockResolvedValue(mockLeaderboardResponse),
      disbandGuild: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GuildsController],
      providers: [
        {
          provide: GuildsService,
          useValue: mockGuildsService,
        },
      ],
    }).compile();

    controller = module.get<GuildsController>(GuildsController);
    service = module.get<GuildsService>(GuildsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createGuild', () => {
    it('should create a guild', async () => {
      const dto: CreateGuildDto = {
        name: 'Test Guild',
        tag: 'TEST',
        description: 'A test guild',
        maxMembers: 20,
      };

      const req = { user: { sub: 'user-1' } } as any;

      const result = await controller.createGuild(req, dto);

      expect(service.createGuild).toHaveBeenCalledWith('user-1', dto);
      expect(result).toEqual(mockGuildResponse);
    });
  });

  describe('joinGuild', () => {
    it('should join a guild', async () => {
      const dto: JoinGuildDto = {};
      const req = { user: { sub: 'user-2' } } as any;

      const result = await controller.joinGuild(req, 'guild-1', dto);

      expect(service.joinGuild).toHaveBeenCalledWith('user-2', 'guild-1', dto);
      expect(result).toEqual(mockGuildResponse);
    });
  });

  describe('removeMember', () => {
    it('should leave guild when removing self', async () => {
      const req = { user: { sub: 'user-1' } } as any;

      await controller.removeMember(req, 'guild-1', 'user-1');

      expect(service.leaveGuild).toHaveBeenCalledWith('user-1', 'guild-1');
    });

    it('should kick member when removing other user', async () => {
      const req = { user: { sub: 'user-1' } } as any;

      await controller.removeMember(req, 'guild-1', 'user-2');

      expect(service.kickMember).toHaveBeenCalledWith('user-1', 'guild-1', 'user-2');
    });
  });

  describe('updateMemberRole', () => {
    it('should update member role', async () => {
      const dto: UpdateRoleDto = { role: 'officer' };
      const req = { user: { sub: 'user-1' } } as any;

      const result = await controller.updateMemberRole(req, 'guild-1', 'user-2', dto);

      expect(service.updateMemberRole).toHaveBeenCalledWith('user-1', 'guild-1', 'user-2', dto);
      expect(result).toEqual(mockMemberResponse);
    });
  });

  describe('getGuildProfile', () => {
    it('should return guild profile', async () => {
      const result = await controller.getGuildProfile('guild-1');

      expect(service.getGuildProfile).toHaveBeenCalledWith('guild-1');
      expect(result).toEqual(mockGuildResponse);
    });
  });

  describe('getGuildLeaderboard', () => {
    it('should return guild leaderboard', async () => {
      const result = await controller.getGuildLeaderboard();

      expect(service.getGuildLeaderboard).toHaveBeenCalled();
      expect(result).toEqual(mockLeaderboardResponse);
    });
  });

  describe('disbandGuild', () => {
    it('should disband guild', async () => {
      const req = { user: { sub: 'user-1' } } as any;

      await controller.disbandGuild(req, 'guild-1');

      expect(service.disbandGuild).toHaveBeenCalledWith('user-1', 'guild-1');
    });
  });
});
