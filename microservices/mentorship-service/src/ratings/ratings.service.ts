import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { RatingsService } from './ratings.service';

@Controller('ratings')
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Post()
  async submit(
    @Body() body: { mentorId: string; studentId: string; mentorshipId: number; rating: number; comment?: string },
  ) {
    return this.ratingsService.submitRating(
      body.mentorId,
      body.studentId,
      body.mentorshipId,
      body.rating,
      body.comment,
    );
  }

  @Get('mentor/:mentorId')
  async getByMentor(@Param('mentorId') mentorId: string) {
    return this.ratingsService.getMentorRatings(mentorId);
  }
}
