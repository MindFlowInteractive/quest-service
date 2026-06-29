import { Controller, Get, Post, Body } from '@nestjs/common';
import { ChallengeService } from './challenge.service';

@Controller('challenges')
export class ChallengeController {
  constructor(private readonly service: ChallengeService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('today')
  findToday() {
    return this.service.findToday();
  }

  @Post()
  create(@Body() body: { title: string; scheduledDate: string }) {
    return this.service.create(body.title, body.scheduledDate);
  }
}