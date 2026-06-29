import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { LoyaltyService } from './loyalty.service';

@Controller('loyalty')
export class LoyaltyController {
  constructor(private readonly service: LoyaltyService) {}

  @Get(':userId')
  getPoints(@Param('userId') userId: string) {
    return this.service.getPoints(userId);
  }

  @Post(':userId/add')
  addPoints(@Param('userId') userId: string, @Body() body: { amount: number }) {
    return this.service.addPoints(userId, body.amount);
  }
}