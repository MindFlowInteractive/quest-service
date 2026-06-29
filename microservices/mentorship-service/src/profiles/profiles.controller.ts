import { Controller, Post, Get, Body, Param, Put } from '@nestjs/common';
import { ProfilesService } from './profiles.service';

@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Post('mentor')
  async createMentor(@Body() body: { userId: string; specialties: string[] }) {
    return this.profilesService.createMentorProfile(body.userId, body.specialties);
  }

  @Post('student')
  async createStudent(@Body() body: { userId: string; interests: string[] }) {
    return this.profilesService.createStudentProfile(body.userId, body.interests);
  }

  @Get('mentor/:userId')
  async getMentor(@Param('userId') userId: string) {
    return this.profilesService.getMentorProfile(userId);
  }

  @Get('student/:userId')
  async getStudent(@Param('userId') userId: string) {
    return this.profilesService.getStudentProfile(userId);
  }

  @Put('mentor/:userId/availability')
  async updateAvailability(
    @Param('userId') userId: string,
    @Body('isAvailable') isAvailable: boolean,
  ) {
    return this.profilesService.updateMentorAvailability(userId, isAvailable);
  }
}
