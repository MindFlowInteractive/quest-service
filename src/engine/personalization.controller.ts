import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { PersonalizationService } from './personalization.service';

@Controller('personalization')
export class PersonalizationController {
  constructor(private readonly personalizationService: PersonalizationService) {}

  @Get('resolve/:userId')
  async getUserRuntimeContext(@Param('userId') userId: string) {
    return this.personalizationService.resolvePersonalizedContext(userId);
  }

  @Post('track')
  async trackUserInteraction(
    @Body() body: { userId: string; category: string; weight?: number },
  ) {
    return this.personalizationService.recordInteraction(body.userId, body.category, body.weight);
  }
}