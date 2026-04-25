// difficulty-feedback.controller.ts
import { Controller, Post, Get, Param, Body, Req } from '@nestjs/common';
import { DifficultyFeedbackService } from './difficulty-feedback.service';

@Controller('puzzles')
export class DifficultyFeedbackController {
  constructor(private readonly service: DifficultyFeedbackService) {}

  @Post(':id/feedback')
  async submit(@Param('id') id: string, @Req() req, @Body('rating') rating: string) {
    return this.service.submitFeedback(id, req.user.id, rating);
  }

  @Get(':id/feedback/summary')
  async summary(@Param('id') id: string) {
    return this.service.getSummary(id);
  }

  @Get('feedback/flagged')
  async flagged() {
    return this.service.getFlagged();
  }
}
