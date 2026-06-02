import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { MilestonesService } from './milestones.service';

@Controller('milestones')
export class MilestonesController {
  constructor(private readonly milestonesService: MilestonesService) {}

  @Post()
  async create(
    @Body() body: { mentorshipId: number; title: string; description: string; rewardAmount: number },
  ) {
    return this.milestonesService.createMilestone(body.mentorshipId, body.title, body.description, body.rewardAmount);
  }

  @Post(':id/progress')
  async addProgress(
    @Param('id') id: number,
    @Body() body: { updateMessage: string; progressPercentage: number },
  ) {
    return this.milestonesService.addProgress(id, body.updateMessage, body.progressPercentage);
  }

  @Get('mentorship/:mentorshipId')
  async getByMentorship(@Param('mentorshipId') mentorshipId: number) {
    return this.milestonesService.getMilestonesByMentorship(mentorshipId);
  }
}
