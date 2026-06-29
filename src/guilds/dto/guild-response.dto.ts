import { GuildRole } from '../entities/guild-member.entity';

export class GuildMemberResponseDto {
  id: string;
  playerId: string;
  role: GuildRole;
  joinedAt: Date;
}

export class GuildResponseDto {
  id: string;
  name: string;
  tag: string;
  description?: string;
  ownerId: string;
  maxMembers: number;
  aggregateScore: number;
  memberCount: number;
  createdAt: Date;
  updatedAt: Date;
  members: GuildMemberResponseDto[];
}

export class LeaderboardEntryDto {
  rank: number;
  guildId: string;
  guildName: string;
  guildTag: string;
  aggregateScore: number;
  memberCount: number;
}

export class GuildLeaderboardResponseDto {
  entries: LeaderboardEntryDto[];
  lastResetAt?: Date;
  nextResetAt?: Date;
}
