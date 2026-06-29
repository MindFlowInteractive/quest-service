import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PlayerService } from './player.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { TrackProgressDto } from './dto/track-progress.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('players')
@UseGuards(JwtAuthGuard)
export class PlayerController {
  constructor(private readonly playerService: PlayerService) {}

  @Get('profile')
  getProfile(@Request() req) {
    return this.playerService.getProfile(req.user.id);
  }

  @Patch('profile')
  updateProfile(@Request() req, @Body() updateProfileDto: UpdateProfileDto) {
    return this.playerService.updateProfile(req.user.id, updateProfileDto);
  }

  @Post('progress')
  trackProgress(@Request() req, @Body() trackProgressDto: TrackProgressDto) {
    return this.playerService.trackProgress(req.user.id, trackProgressDto);
  }

  @Get('progress')
  getProgressHistory(@Request() req) {
    return this.playerService.getProgressHistory(req.user.id);
  }

  @Get('statistics')
  getStatistics(@Request() req) {
    return this.playerService.getStatistics(req.user.id);
  }

  @Delete('deactivate')
  deactivatePlayer(@Request() req) {
    return this.playerService.deactivatePlayer(req.user.id);
  }
}