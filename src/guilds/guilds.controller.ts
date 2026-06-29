import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
  Body,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { GuildsService } from './guilds.service';
import { CreateGuildDto } from './dto/create-guild.dto';
import { JoinGuildDto } from './dto/join-guild.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { GuildResponseDto, GuildLeaderboardResponseDto, GuildMemberResponseDto } from './dto/guild-response.dto';

@Controller('guilds')
export class GuildsController {
  constructor(private readonly guildsService: GuildsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createGuild(
    @Req() req: Request,
    @Body() dto: CreateGuildDto,
  ): Promise<GuildResponseDto> {
    const userId = req.user?.['sub'] || req.user?.['userId'];
    if (!userId) {
      throw new Error('User not authenticated');
    }
    return this.guildsService.createGuild(userId, dto);
  }

  @Post(':id/join')
  @HttpCode(HttpStatus.OK)
  async joinGuild(
    @Req() req: Request,
    @Param('id') guildId: string,
    @Body() dto: JoinGuildDto,
  ): Promise<GuildResponseDto> {
    const userId = req.user?.['sub'] || req.user?.['userId'];
    if (!userId) {
      throw new Error('User not authenticated');
    }
    return this.guildsService.joinGuild(userId, guildId, dto);
  }

  @Delete(':id/members/:playerId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMember(
    @Req() req: Request,
    @Param('id') guildId: string,
    @Param('playerId') playerId: string,
  ): Promise<void> {
    const userId = req.user?.['sub'] || req.user?.['userId'];
    if (!userId) {
      throw new Error('User not authenticated');
    }

    // If removing self, it's a leave operation
    if (userId === playerId) {
      return this.guildsService.leaveGuild(userId, guildId);
    }

    // Otherwise, it's a kick operation
    return this.guildsService.kickMember(userId, guildId, playerId);
  }

  @Patch(':id/members/:playerId/role')
  @HttpCode(HttpStatus.OK)
  async updateMemberRole(
    @Req() req: Request,
    @Param('id') guildId: string,
    @Param('playerId') playerId: string,
    @Body() dto: UpdateRoleDto,
  ): Promise<GuildMemberResponseDto> {
    const userId = req.user?.['sub'] || req.user?.['userId'];
    if (!userId) {
      throw new Error('User not authenticated');
    }
    return this.guildsService.updateMemberRole(userId, guildId, playerId, dto);
  }

  @Get(':id')
  async getGuildProfile(@Param('id') guildId: string): Promise<GuildResponseDto> {
    return this.guildsService.getGuildProfile(guildId);
  }

  @Get('leaderboard')
  async getGuildLeaderboard(): Promise<GuildLeaderboardResponseDto> {
    return this.guildsService.getGuildLeaderboard();
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async disbandGuild(
    @Req() req: Request,
    @Param('id') guildId: string,
  ): Promise<void> {
    const userId = req.user?.['sub'] || req.user?.['userId'];
    if (!userId) {
      throw new Error('User not authenticated');
    }
    return this.guildsService.disbandGuild(userId, guildId);
  }
}
