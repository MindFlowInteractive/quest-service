import { Controller, Post, Get, Body, Param, Put } from '@nestjs/common';
import { SessionsService } from './sessions.service';

@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post()
  async create(
    @Body() body: { mentorshipId: number; title: string; scheduledAt: string; notes?: string },
  ) {
    return this.sessionsService.createSession(
      body.mentorshipId,
      body.title,
      new Date(body.scheduledAt),
      body.notes,
    );
  }

  @Put(':id/verify')
  async verify(@Param('id') id: number) {
    return this.sessionsService.verifySession(id);
  }

  @Get('mentorship/:mentorshipId')
  async getByMentorship(@Param('mentorshipId') mentorshipId: number) {
    return this.sessionsService.getSessionsByMentorship(mentorshipId);
  }
}
