import { Controller, Post, Get, Body, Param, Put, Query } from '@nestjs/common';
import { MentorshipsService } from './mentorships.service';

@Controller('mentorships')
export class MentorshipsController {
  constructor(private readonly mentorshipsService: MentorshipsService) {}

  @Post('request')
  async request(
    @Body() body: { mentorId: string; studentId: string; goal: string },
  ) {
    return this.mentorshipsService.requestMentorship(body.mentorId, body.studentId, body.goal);
  }

  @Put(':id/accept')
  async accept(@Param('id') id: number) {
    return this.mentorshipsService.acceptMentorship(id);
  }

  @Put(':id/complete')
  async complete(@Param('id') id: number) {
    return this.mentorshipsService.completeMentorship(id);
  }

  @Get('mentor/:mentorId')
  async getByMentor(@Param('mentorId') mentorId: string) {
    return this.mentorshipsService.findByMentor(mentorId);
  }

  @Get('student/:studentId')
  async getByStudent(@Param('studentId') studentId: string) {
    return this.mentorshipsService.findByStudent(studentId);
  }

  @Get(':id')
  async getOne(@Param('id') id: number) {
    return this.mentorshipsService.findOne(id);
  }
}
