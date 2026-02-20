import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';

@Controller('recommendations')
export class RecommendationsController {
  constructor(private readonly svc: RecommendationsService) {}

  @Post('register-puzzle')
  registerPuzzle(@Body() body: { id: string; tags: string[]; difficulty: number }) {
    this.svc.registerPuzzle(body);
    return { ok: true };
  }

  @Post('upsert-player')
  upsertPlayer(@Body() body: { id: string; skillLevel?: number; preferences?: string[] }) {
    return this.svc.upsertPlayer(body);
  }

  @Post('track')
  track(@Body() body: { playerId: string; puzzleId: string; type: 'view' | 'click' | 'start' | 'complete' }) {
    this.svc.trackEvent({ ...body, timestamp: Date.now() });
    return { ok: true };
  }

  @Get(':playerId')
  get(@Param('playerId') playerId: string) {
    return this.svc.generateRecommendations(playerId);
  }

  @Get('metrics/all')
  metrics() {
    return this.svc.getMetrics();
  }
}
