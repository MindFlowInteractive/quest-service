import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
  Req,
} from '@nestjs/common';
import { DailyChallengesService } from '../services/daily-challenges.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Request } from 'express';

// Ensure the Request type has user property injected by passport-jwt
interface AuthenticatedRequest extends Request {
  user: { id: string; email: string; role: string };
}

@Controller('daily-challenges')
@UseGuards(JwtAuthGuard)
export class DailyChallengesController {
  constructor(
    private readonly dailyChallengesService: DailyChallengesService,
  ) {}

  @Get('today')
  async getTodayChallenge(@Req() req: AuthenticatedRequest) {
    const userId = req.user.id;
    return this.dailyChallengesService.getActiveChallenge(userId);
  }

  @Post(':id/complete')
  async completeChallenge(
    @Param('id') challengeId: string,
    @Body() body: { score: number; timeSpent: number },
    @Req() req: AuthenticatedRequest,
  ) {
    return this.dailyChallengesService.completeChallenge(
      req.user.id,
      challengeId,
      body,
    );
  }

  @Get('history')
  async getHistory(
    @Req() req: AuthenticatedRequest,
    @Query('limit') limit: number,
  ) {
    return this.dailyChallengesService.getHistory(req.user.id, limit || 30);
  }
}
