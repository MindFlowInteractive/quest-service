import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { LeaderboardService } from '../services/leaderboard.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get()
  @ApiOperation({ summary: 'Liveness/readiness probe' })
  async get() {
    const stats = await this.leaderboardService.globalStats();
    return {
      status: 'ok',
      service: 'bounty-security-service',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      stats,
    };
  }
}
