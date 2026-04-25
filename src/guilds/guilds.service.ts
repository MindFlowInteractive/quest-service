import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Guild } from './entities/guild.entity';
import { GuildMember, GuildRole } from './entities/guild-member.entity';
import { User } from '../users/entities/user.entity';
import { UserPuzzleCompletion } from '../users/entities/user-puzzle-completion.entity';
import { CreateGuildDto } from './dto/create-guild.dto';
import { JoinGuildDto } from './dto/join-guild.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { GuildResponseDto, GuildMemberResponseDto, LeaderboardEntryDto, GuildLeaderboardResponseDto } from './dto/guild-response.dto';

@Injectable()
export class GuildsService {
  constructor(
    @InjectRepository(Guild)
    private guildRepository: Repository<Guild>,
    @InjectRepository(GuildMember)
    private guildMemberRepository: Repository<GuildMember>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserPuzzleCompletion)
    private userPuzzleCompletionRepository: Repository<UserPuzzleCompletion>,
  ) {}

  private roleHierarchy: Record<GuildRole, number> = {
    owner: 3,
    officer: 2,
    member: 1,
  };

  async createGuild(userId: string, dto: CreateGuildDto): Promise<GuildResponseDto> {
    // Check if user is already in a guild
    const existingMembership = await this.guildMemberRepository.findOne({
      where: { playerId: userId },
    });
    if (existingMembership) {
      throw new BadRequestException('User is already a member of a guild');
    }

    // Check if tag is unique
    const existingGuild = await this.guildRepository.findOne({
      where: { tag: dto.tag.toUpperCase() },
    });
    if (existingGuild) {
      throw new BadRequestException('Guild tag already exists');
    }

    const guild = this.guildRepository.create({
      name: dto.name,
      tag: dto.tag.toUpperCase(),
      description: dto.description,
      ownerId: userId,
      maxMembers: dto.maxMembers || 20,
      aggregateScore: 0,
    });

    const savedGuild = await this.guildRepository.save(guild);

    // Add owner as first member
    const ownerMember = this.guildMemberRepository.create({
      guildId: savedGuild.id,
      playerId: userId,
      role: 'owner',
    });
    await this.guildMemberRepository.save(ownerMember);

    return this.toGuildResponseDto(savedGuild, [ownerMember]);
  }

  async joinGuild(userId: string, guildId: string, dto: JoinGuildDto): Promise<GuildResponseDto> {
    // Check if user is already in a guild
    const existingMembership = await this.guildMemberRepository.findOne({
      where: { playerId: userId },
    });
    if (existingMembership) {
      throw new BadRequestException('User is already a member of a guild');
    }

    const guild = await this.guildRepository.findOne({
      where: { id: guildId },
    });
    if (!guild) {
      throw new NotFoundException('Guild not found');
    }

    // Check if guild is full
    const memberCount = await this.guildMemberRepository.count({
      where: { guildId: guild.id },
    });
    if (memberCount >= guild.maxMembers) {
      throw new BadRequestException('Guild is full');
    }

    // Create member entry
    const member = this.guildMemberRepository.create({
      guildId: guild.id,
      playerId: userId,
      role: 'member',
    });
    await this.guildMemberRepository.save(member);

    // Recalculate guild score
    await this.recalculateGuildScore(guild.id);

    const updatedGuild = await this.guildRepository.findOne({
      where: { id: guild.id },
      relations: ['members'],
    });

    return this.toGuildResponseDto(updatedGuild, updatedGuild.members);
  }

  async leaveGuild(userId: string, guildId: string): Promise<void> {
    const membership = await this.guildMemberRepository.findOne({
      where: { guildId, playerId: userId },
    });
    if (!membership) {
      throw new NotFoundException('User is not a member of this guild');
    }

    // Owner cannot leave, must disband instead
    if (membership.role === 'owner') {
      throw new BadRequestException('Owner cannot leave guild. Use disband endpoint instead.');
    }

    await this.guildMemberRepository.delete(membership.id);
    await this.recalculateGuildScore(guildId);
  }

  async kickMember(
    requesterId: string,
    guildId: string,
    targetPlayerId: string,
  ): Promise<void> {
    const requesterMembership = await this.guildMemberRepository.findOne({
      where: { guildId, playerId: requesterId },
    });
    if (!requesterMembership) {
      throw new NotFoundException('Requester is not a member of this guild');
    }

    const targetMembership = await this.guildMemberRepository.findOne({
      where: { guildId, playerId: targetPlayerId },
    });
    if (!targetMembership) {
      throw new NotFoundException('Target user is not a member of this guild');
    }

    // Check role hierarchy: officer+ can kick members, owner can kick anyone
    const requesterLevel = this.roleHierarchy[requesterMembership.role];
    const targetLevel = this.roleHierarchy[targetMembership.role];

    if (requesterLevel <= targetLevel) {
      throw new ForbiddenException('You do not have permission to kick this member');
    }

    await this.guildMemberRepository.delete(targetMembership.id);
    await this.recalculateGuildScore(guildId);
  }

  async updateMemberRole(
    requesterId: string,
    guildId: string,
    targetPlayerId: string,
    dto: UpdateRoleDto,
  ): Promise<GuildMemberResponseDto> {
    const requesterMembership = await this.guildMemberRepository.findOne({
      where: { guildId, playerId: requesterId },
    });
    if (!requesterMembership) {
      throw new NotFoundException('Requester is not a member of this guild');
    }

    if (requesterMembership.role !== 'owner') {
      throw new ForbiddenException('Only owner can change member roles');
    }

    const targetMembership = await this.guildMemberRepository.findOne({
      where: { guildId, playerId: targetPlayerId },
    });
    if (!targetMembership) {
      throw new NotFoundException('Target user is not a member of this guild');
    }

    // Owner cannot change their own role
    if (requesterId === targetPlayerId) {
      throw new BadRequestException('Owner cannot change their own role');
    }

    // Only one owner allowed
    if (dto.role === 'owner') {
      throw new BadRequestException('There can only be one owner. Transfer ownership instead.');
    }

    targetMembership.role = dto.role;
    const updated = await this.guildMemberRepository.save(targetMembership);

    return {
      id: updated.id,
      playerId: updated.playerId,
      role: updated.role,
      joinedAt: updated.joinedAt,
    };
  }

  async getGuildProfile(guildId: string): Promise<GuildResponseDto> {
    const guild = await this.guildRepository.findOne({
      where: { id: guildId },
      relations: ['members'],
    });

    if (!guild) {
      throw new NotFoundException('Guild not found');
    }

    return this.toGuildResponseDto(guild, guild.members);
  }

  async getGuildLeaderboard(): Promise<GuildLeaderboardResponseDto> {
    const guilds = await this.guildRepository.find({
      order: { aggregateScore: 'DESC' },
      take: 50,
    });

    const entries: LeaderboardEntryDto[] = await Promise.all(
      guilds.map(async (guild, index) => {
        const memberCount = await this.guildMemberRepository.count({
          where: { guildId: guild.id },
        });
        return {
          rank: index + 1,
          guildId: guild.id,
          guildName: guild.name,
          guildTag: guild.tag,
          aggregateScore: guild.aggregateScore,
          memberCount,
        };
      }),
    );

    // Calculate weekly reset times (Monday at 00:00 UTC)
    const now = new Date();
    const dayOfWeek = now.getUTCDay();
    const daysUntilMonday = dayOfWeek === 1 ? 0 : (8 - dayOfWeek) % 7;
    const nextReset = new Date(now);
    nextReset.setUTCDate(now.getUTCDate() + daysUntilMonday);
    nextReset.setUTCHours(0, 0, 0, 0);

    const lastReset = new Date(nextReset);
    lastReset.setUTCDate(lastReset.getUTCDate() - 7);

    return {
      entries,
      lastResetAt: lastReset,
      nextResetAt: nextReset,
    };
  }

  async disbandGuild(userId: string, guildId: string): Promise<void> {
    const guild = await this.guildRepository.findOne({
      where: { id: guildId },
    });
    if (!guild) {
      throw new NotFoundException('Guild not found');
    }

    if (guild.ownerId !== userId) {
      throw new ForbiddenException('Only owner can disband the guild');
    }

    // Remove all members (cascade will handle this via the relationship)
    await this.guildMemberRepository.delete({ guildId });
    await this.guildRepository.delete(guildId);
  }

  async recalculateGuildScore(guildId: string): Promise<void> {
    const members = await this.guildMemberRepository.find({
      where: { guildId },
    });

    if (members.length === 0) {
      await this.guildRepository.update(guildId, { aggregateScore: 0, lastScoreUpdateAt: new Date() });
      return;
    }

    const playerIds = members.map((m) => m.playerId);

    // Get puzzle completions for all members
    const completions = await this.userPuzzleCompletionRepository
      .createQueryBuilder('completion')
      .where('completion.user.id IN (:...playerIds)', { playerIds })
      .leftJoin('completion.user', 'user')
      .getMany();

    // Calculate aggregate score (sum of all member puzzle completions)
    const aggregateScore = completions.length;

    await this.guildRepository.update(guildId, {
      aggregateScore,
      lastScoreUpdateAt: new Date(),
    });
  }

  async resetWeeklyLeaderboard(): Promise<void> {
    // Reset all guild scores to 0
    await this.guildRepository.update({}, { aggregateScore: 0, lastScoreUpdateAt: new Date() });
  }

  @Cron(CronExpression.EVERY_WEEK)
  async handleWeeklyLeaderboardReset(): Promise<void> {
    await this.resetWeeklyLeaderboard();
  }

  private toGuildResponseDto(guild: Guild, members: GuildMember[]): GuildResponseDto {
    const memberDtos: GuildMemberResponseDto[] = members.map((member) => ({
      id: member.id,
      playerId: member.playerId,
      role: member.role,
      joinedAt: member.joinedAt,
    }));

    return {
      id: guild.id,
      name: guild.name,
      tag: guild.tag,
      description: guild.description,
      ownerId: guild.ownerId,
      maxMembers: guild.maxMembers,
      aggregateScore: guild.aggregateScore,
      memberCount: members.length,
      createdAt: guild.createdAt,
      updatedAt: guild.updatedAt,
      members: memberDtos,
    };
  }
}
