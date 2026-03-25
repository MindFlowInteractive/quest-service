import { Controller, Get, Post, Body, Param, Delete, Query } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { CreateWebhookDto } from './dto/create-webhook.dto';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post()
  create(@Body() createWebhookDto: CreateWebhookDto) {
    return this.webhooksService.create(createWebhookDto);
  }

  @Get()
  findAll(@Query('userId') userId?: string, @Query('appId') appId?: string) {
    return this.webhooksService.findAll(userId, appId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.webhooksService.remove(id);
  }

  @Get(':id/deliveries')
  getDeliveries(@Param('id') id: string) {
    return this.webhooksService.getDeliveries(id);
  }
}