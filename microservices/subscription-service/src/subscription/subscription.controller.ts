import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';

@Controller('subscriptions')
export class SubscriptionController {
  constructor(private readonly service: SubscriptionService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('user/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.service.findByUser(userId);
  }

  @Post()
  create(@Body() body: { userId: string; plan: string }) {
    return this.service.create(body.userId, body.plan);
  }
}