import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';

@Controller('subscriptions')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post()
  createSubscription(@Body() dto: CreateSubscriptionDto) {
    return this.subscriptionService.createSubscription(dto);
  }

  @Get('user/:userId')
  getSubscriptionsByUser(@Param('userId') userId: string) {
    return this.subscriptionService.findByUser(userId);
  }

  @Get(':id')
  getSubscription(@Param('id') id: string) {
    return this.subscriptionService.findById(id);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  cancelSubscription(@Param('id') id: string) {
    return this.subscriptionService.cancelSubscription(id);
  }

  @Post(':id/bill')
  @HttpCode(HttpStatus.OK)
  processBilling(@Param('id') id: string) {
    return this.subscriptionService.processBillingCycle(id);
  }
}
