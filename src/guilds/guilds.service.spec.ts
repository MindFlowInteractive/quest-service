import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { GuildsService } from './guilds.service';
import { Guild } from './entities/guild.entity';
import { GuildMember } from './entities/guild-member.entity';
import { User } from '../users/entities/user.entity';
import { UserPuzzleCompletion } from '../users/entities/user-puzzle-completion.entity';
import { CreateGuildDto } from './dto/create-guild.dto';
import { JoinGuildDto } from './dto/join-guild.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

describe('GuildsService', () => {
  let service: GuildsService;
  let guildRepository: Repository<Guild>;
  let guildMemberRepository: Repository<GuildMember>;
  let userRepository: Repository<User>;
  let userPuzzleCompletionRepository: Repository<UserPuzzleCompletion>;

  const mockUser = {
    id: 'user-1',
    username: 'testuser',
    email: 'test@example.com',
    password: 'hashedpassword',
    firstName: 'Test',
    lastName: 'User',
  };

  const mockGuild = {
    id: 'guild-1',
    name: 'Test Guild',
    tag: 'TEST',
    description: 'A test guild',
    ownerId: 'user-1',
    maxMembers: 20,
    aggregateScore: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockGuildMember = {
    id: 'member-1',
    guildId: 'guild-1',
    playerId: 'user-1',
    role: 'owner' as const,
    joinedAt: new Date(),
  };

  const mockPuzzleCompletion = {
    id: 'completion-1',
    user: mockUser as any,
    puzzle: {} as any,
    completedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GuildsService,
        {
          provide: getRepositoryToken(Guild),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(GuildMember),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(User),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(UserPuzzleCompletion),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<GuildsService>(GuildsService);
    guildRepository = module.get<Repository<Guild>>(getRepositoryToken(Guild));
    guildMemberRepository = module.get<Repository<GuildMember>>(getRepositoryToken(GuildMember));
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    userPuzzleCompletionRepository = module.get<Repository<UserPuzzleCompletion>>(
      getRepositoryToken(UserPuzzleCompletion),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createGuild', () => {
    it('should create a guild successfully', async () => {
      const dto: CreateGuildDto = {
        name: 'Test Guild',
        tag: 'TEST',
        description: 'A test guild',
        maxMembers: 20,
      };

      jest.spyOn(guildMemberRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(guildRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(guildRepository, 'create').mockReturnValue(mockGuild as any);
      jest.spyOn(guildRepository, 'save').mockResolvedValue(mockGuild as any);
      jest.spyOn(guildMemberRepository, 'create').mockReturnValue(mockGuildMember as any);
      jest.spyOn(guildMemberRepository, 'save').mockResolvedValue(mockGuildMember as any);

      const result = await service.createGuild('user-1', dto);

      expect(result).toBeDefined();
      expect(result.name).toBe(dto.name);
      expect(result.tag).toBe(dto.tag.toUpperCase());
      expect(result.ownerId).toBe('user-1');
    });

    it('should throw BadRequestException if user is already in a guild', async () => {
      const dto: CreateGuildDto = {
        name: 'Test Guild',
        tag: 'TEST',
      };

      jest.spyOn(guildMemberRepository, 'findOne').mockResolvedValue(mockGuildMember as any);

      await expect(service.createGuild('user-1', dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if tag already exists', async () => {
      const dto: CreateGuildDto = {
        name: 'Test Guild',
        tag: 'TEST',
      };

      jest.spyOn(guildMemberRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(guildRepository, 'findOne').mockResolvedValue(mockGuild as any);

      await expect(service.createGuild('user-1', dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('joinGuild', () => {
    it('should join a guild successfully', async () => {
      const dto: JoinGuildDto = {};

      jest.spyOn(guildMemberRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(guildRepository, 'findOne').mockResolvedValue(mockGuild as any);
      jest.spyOn(guildMemberRepository, 'count').mockResolvedValue(0);
      jest.spyOn(guildMemberRepository, 'create').mockReturnValue(mockGuildMember as any);
      jest.spyOn(guildMemberRepository, 'save').mockResolvedValue(mockGuildMember as any);
      jest.spyOn(service, 'recalculateGuildScore').mockResolvedValue();
      jest.spyOn(guildRepository, 'findOne').mockResolvedValue({
        ...mockGuild,
        members: [mockGuildMember],
      } as any);

      const result = await service.joinGuild('user-2', 'guild-1', dto);

      expect(result).toBeDefined();
      expect(result.id).toBe('guild-1');
    });

    it('should throw BadRequestException if user is already in a guild', async () => {
      const dto: JoinGuildDto = {};

      jest.spyOn(guildMemberRepository, 'findOne').mockResolvedValue(mockGuildMember as any);

      await expect(service.joinGuild('user-1', 'guild-1', dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if guild not found', async () => {
      const dto: JoinGuildDto = {};

      jest.spyOn(guildMemberRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(guildRepository, 'findOne').mockResolvedValue(null);

      await expect(service.joinGuild('user-2', 'guild-1', dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if guild is full', async () => {
      const dto: JoinGuildDto = {};

      jest.spyOn(guildMemberRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(guildRepository, 'findOne').mockResolvedValue(mockGuild as any);
      jest.spyOn(guildMemberRepository, 'count').mockResolvedValue(20);

      await expect(service.joinGuild('user-2', 'guild-1', dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('leaveGuild', () => {
    it('should leave guild successfully', async () => {
      const member = { ...mockGuildMember, role: 'member' as const };

      jest.spyOn(guildMemberRepository, 'findOne').mockResolvedValue(member as any);
      jest.spyOn(guildMemberRepository, 'delete').mockResolvedValue(undefined);
      jest.spyOn(service, 'recalculateGuildScore').mockResolvedValue();

      await service.leaveGuild('user-1', 'guild-1');

      expect(guildMemberRepository.delete).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user is not a member', async () => {
      jest.spyOn(guildMemberRepository, 'findOne').mockResolvedValue(null);

      await expect(service.leaveGuild('user-1', 'guild-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if owner tries to leave', async () => {
      jest.spyOn(guildMemberRepository, 'findOne').mockResolvedValue(mockGuildMember as any);

      await expect(service.leaveGuild('user-1', 'guild-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('kickMember', () => {
    it('should kick member successfully as officer', async () => {
      const requesterMember = { ...mockGuildMember, role: 'officer' as const };
      const targetMember = { ...mockGuildMember, playerId: 'user-2', role: 'member' as const };

      jest.spyOn(guildMemberRepository, 'findOne').mockResolvedValueOnce(requesterMember as any);
      jest.spyOn(guildMemberRepository, 'findOne').mockResolvedValueOnce(targetMember as any);
      jest.spyOn(guildMemberRepository, 'delete').mockResolvedValue(undefined);
      jest.spyOn(service, 'recalculateGuildScore').mockResolvedValue();

      await service.kickMember('user-1', 'guild-1', 'user-2');

      expect(guildMemberRepository.delete).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if requester has insufficient role', async () => {
      const requesterMember = { ...mockGuildMember, role: 'member' as const };
      const targetMember = { ...mockGuildMember, playerId: 'user-2', role: 'member' as const };

      jest.spyOn(guildMemberRepository, 'findOne').mockResolvedValueOnce(requesterMember as any);
      jest.spyOn(guildMemberRepository, 'findOne').mockResolvedValueOnce(targetMember as any);

      await expect(service.kickMember('user-1', 'guild-1', 'user-2')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException if trying to kick higher role', async () => {
      const requesterMember = { ...mockGuildMember, role: 'officer' as const };
      const targetMember = { ...mockGuildMember, playerId: 'user-2', role: 'owner' as const };

      jest.spyOn(guildMemberRepository, 'findOne').mockResolvedValueOnce(requesterMember as any);
      jest.spyOn(guildMemberRepository, 'findOne').mockResolvedValueOnce(targetMember as any);

      await expect(service.kickMember('user-1', 'guild-1', 'user-2')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('updateMemberRole', () => {
    it('should update role successfully as owner', async () => {
      const dto: UpdateRoleDto = { role: 'officer' };

      jest.spyOn(guildMemberRepository, 'findOne').mockResolvedValue(mockGuildMember as any);
      jest.spyOn(guildMemberRepository, 'findOne').mockResolvedValue({
        ...mockGuildMember,
        playerId: 'user-2',
        role: 'member',
      } as any);
      jest.spyOn(guildMemberRepository, 'save').mockResolvedValue({
        ...mockGuildMember,
        playerId: 'user-2',
        role: 'officer',
      } as any);

      const result = await service.updateMemberRole('user-1', 'guild-1', 'user-2', dto);

      expect(result.role).toBe('officer');
    });

    it('should throw ForbiddenException if requester is not owner', async () => {
      const dto: UpdateRoleDto = { role: 'officer' };
      const requesterMember = { ...mockGuildMember, role: 'officer' as const };

      jest.spyOn(guildMemberRepository, 'findOne').mockResolvedValue(requesterMember as any);

      await expect(service.updateMemberRole('user-1', 'guild-1', 'user-2', dto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw BadRequestException if trying to change own role', async () => {
      const dto: UpdateRoleDto = { role: 'officer' };

      jest.spyOn(guildMemberRepository, 'findOne').mockResolvedValue(mockGuildMember as any);

      await expect(service.updateMemberRole('user-1', 'guild-1', 'user-1', dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if trying to set second owner', async () => {
      const dto: UpdateRoleDto = { role: 'owner' };

      jest.spyOn(guildMemberRepository, 'findOne').mockResolvedValue(mockGuildMember as any);
      jest.spyOn(guildMemberRepository, 'findOne').mockResolvedValue({
        ...mockGuildMember,
        playerId: 'user-2',
      } as any);

      await expect(service.updateMemberRole('user-1', 'guild-1', 'user-2', dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getGuildProfile', () => {
    it('should return guild profile', async () => {
      jest.spyOn(guildRepository, 'findOne').mockResolvedValue({
        ...mockGuild,
        members: [mockGuildMember],
      } as any);

      const result = await service.getGuildProfile('guild-1');

      expect(result).toBeDefined();
      expect(result.id).toBe('guild-1');
      expect(result.name).toBe('Test Guild');
    });

    it('should throw NotFoundException if guild not found', async () => {
      jest.spyOn(guildRepository, 'findOne').mockResolvedValue(null);

      await expect(service.getGuildProfile('guild-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getGuildLeaderboard', () => {
    it('should return leaderboard', async () => {
      jest.spyOn(guildRepository, 'find').mockResolvedValue([mockGuild as any]);
      jest.spyOn(guildMemberRepository, 'count').mockResolvedValue(5);

      const result = await service.getGuildLeaderboard();

      expect(result).toBeDefined();
      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].rank).toBe(1);
      expect(result.nextResetAt).toBeDefined();
    });
  });

  describe('disbandGuild', () => {
    it('should disband guild successfully as owner', async () => {
      jest.spyOn(guildRepository, 'findOne').mockResolvedValue(mockGuild as any);
      jest.spyOn(guildMemberRepository, 'delete').mockResolvedValue(undefined);
      jest.spyOn(guildRepository, 'delete').mockResolvedValue(undefined);

      await service.disbandGuild('user-1', 'guild-1');

      expect(guildMemberRepository.delete).toHaveBeenCalledWith({ guildId: 'guild-1' });
      expect(guildRepository.delete).toHaveBeenCalledWith('guild-1');
    });

    it('should throw NotFoundException if guild not found', async () => {
      jest.spyOn(guildRepository, 'findOne').mockResolvedValue(null);

      await expect(service.disbandGuild('user-1', 'guild-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if requester is not owner', async () => {
      jest.spyOn(guildRepository, 'findOne').mockResolvedValue({
        ...mockGuild,
        ownerId: 'user-2',
      } as any);

      await expect(service.disbandGuild('user-1', 'guild-1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('recalculateGuildScore', () => {
    it('should recalculate score from member puzzle completions', async () => {
      const members = [mockGuildMember, { ...mockGuildMember, playerId: 'user-2' }];
      
      jest.spyOn(guildMemberRepository, 'find').mockResolvedValue(members as any);
      jest.spyOn(userPuzzleCompletionRepository, 'createQueryBuilder').mockReturnValue({
        where: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockPuzzleCompletion, mockPuzzleCompletion]),
      } as any);
      jest.spyOn(guildRepository, 'update').mockResolvedValue(undefined);

      await service.recalculateGuildScore('guild-1');

      expect(guildRepository.update).toHaveBeenCalledWith('guild-1', {
        aggregateScore: 2,
        lastScoreUpdateAt: expect.any(Date),
      });
    });

    it('should set score to 0 if no members', async () => {
      jest.spyOn(guildMemberRepository, 'find').mockResolvedValue([]);
      jest.spyOn(guildRepository, 'update').mockResolvedValue(undefined);

      await service.recalculateGuildScore('guild-1');

      expect(guildRepository.update).toHaveBeenCalledWith('guild-1', {
        aggregateScore: 0,
        lastScoreUpdateAt: expect.any(Date),
      });
    });
  });

  describe('resetWeeklyLeaderboard', () => {
    it('should reset all guild scores', async () => {
      jest.spyOn(guildRepository, 'update').mockResolvedValue(undefined);

      await service.resetWeeklyLeaderboard();

      expect(guildRepository.update).toHaveBeenCalledWith({}, {
        aggregateScore: 0,
        lastScoreUpdateAt: expect.any(Date),
      });
    });
  });
});
