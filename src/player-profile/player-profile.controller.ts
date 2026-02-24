import { Controller, Get, Put, Post, Param, Body, Req, UseGuards, UseInterceptors, UploadedFile, Query, ForbiddenException } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequestWithUser } from '../auth/interfaces/request-with-user.interface';
import { PlayerProfileService } from './services/player-profile.service';
import { UpdateProfileDto, ProfileResponseDto, UpdateBadgesDto, ProfileStatisticsDto } from './dto';
import { PlayerProfile } from './entities/player-profile.entity';
import { FileInterceptor } from '@nestjs/platform-express';

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@Controller('profile')
export class PlayerProfileController {
  constructor(private readonly profileService: PlayerProfileService) {}

  @Get('search')
  @ApiOperation({ summary: 'Search public profiles' })
  async searchProfiles(
    @Query('q') query: string,
    @Query('limit') limit: number = 20,
  ): Promise<ProfileResponseDto[]> {
    return this.profileService.searchProfiles(query, limit);
  }

  @Get('public')
  @ApiOperation({ summary: 'Get public profiles' })
  async getPublicProfiles(
    @Query('limit') limit: number = 50,
    @Query('offset') offset: number = 0,
  ): Promise<ProfileResponseDto[]> {
    return this.profileService.getPublicProfiles(limit, offset);
  }

  @Get(':userId')
  @ApiOperation({ summary: 'Get user profile' })
  async getProfile(
    @Param('userId') userId: string,
    @Req() req: RequestWithUser,
  ): Promise<ProfileResponseDto> {
    const viewerId = req.user?.id;
    return this.profileService.getProfile(userId, viewerId);
  }

  @Put()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update own profile' })
  async updateProfile(
    @Body() dto: UpdateProfileDto,
    @Req() req: RequestWithUser,
  ): Promise<PlayerProfile> {
    return this.profileService.updateProfile(req.user.id, dto);
  }

  @Post('avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload avatar' })
  async uploadAvatar(
    @UploadedFile() file: MulterFile,
    @Req() req: RequestWithUser,
  ): Promise<{ avatarUrl: string }> {
    const url = await this.profileService.uploadAvatar(req.user.id, file);
    return { avatarUrl: url };
  }

  @Post('banner')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload banner' })
  async uploadBanner(
    @UploadedFile() file: MulterFile,
    @Req() req: RequestWithUser,
  ): Promise<{ bannerUrl: string }> {
    const url = await this.profileService.uploadBanner(req.user.id, file);
    return { bannerUrl: url };
  }

  @Put('badges')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update displayed badges' })
  async updateBadges(
    @Body() dto: UpdateBadgesDto,
    @Req() req: RequestWithUser,
  ): Promise<PlayerProfile> {
    return this.profileService.updateBadges(req.user.id, dto.displayedBadges);
  }

  @Put('statistics')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update profile statistics' })
  async updateStatistics(
    @Body() dto: ProfileStatisticsDto,
    @Req() req: RequestWithUser,
  ): Promise<PlayerProfile> {
    return this.profileService.updateStatistics(req.user.id, dto);
  }

  @Get('statistics/:userId')
  @ApiOperation({ summary: 'Get profile statistics' })
  async getStatistics(
    @Param('userId') userId: string,
    @Req() req: RequestWithUser,
  ): Promise<any> {
    // Check if user can view statistics based on privacy settings
    const profile = await this.profileService.getProfile(userId, req.user?.id);
    if (!profile.statistics && !profile.isOwner) {
      throw new ForbiddenException('Statistics are private');
    }
    return this.profileService.getProfileStatistics(userId);
  }
}
