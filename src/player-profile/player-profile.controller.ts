import { Controller, Get, Put, Post, Param, Body, Req, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequestWithUser } from '../auth/interfaces/request-with-user.interface';
import { PlayerProfileService } from './services/player-profile.service';
import { UpdateProfileDto, ProfileResponseDto } from './dto';
import { PlayerProfile } from './entities/player-profile.entity';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('profile')
export class PlayerProfileController {
  constructor(private readonly profileService: PlayerProfileService) {}

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
    @UploadedFile() file: Express.Multer.File,
    @Req() req: RequestWithUser,
  ): Promise<{ avatarUrl: string }> {
    const url = await this.profileService.uploadAvatar(req.user.id, file);
    return { avatarUrl: url };
  }
}