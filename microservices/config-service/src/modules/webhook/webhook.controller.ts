import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { CreateWebhookSubscriptionDto, UpdateWebhookSubscriptionDto } from '../../common';
import { WebhookSubscription } from '../../entities';

@Controller('webhooks')
export class WebhookController {
  constructor(private webhookService: WebhookService) {}

  @Post()
  async create(
    @Body() createWebhookDto: CreateWebhookSubscriptionDto,
  ): Promise<WebhookSubscription> {
    if (!createWebhookDto.serviceName || !createWebhookDto.webhookUrl) {
      throw new BadRequestException('serviceName and webhookUrl are required');
    }
    return this.webhookService.createWebhook(createWebhookDto);
  }

  @Get(':id')
  async getById(@Param('id') id: string): Promise<WebhookSubscription> {
    return this.webhookService.getWebhook(id);
  }

  @Get('service/:serviceName')
  async getByService(@Param('serviceName') serviceName: string): Promise<WebhookSubscription[]> {
    return this.webhookService.getWebhooksByService(serviceName);
  }

  @Get()
  async getAll(): Promise<WebhookSubscription[]> {
    return this.webhookService.getAllWebhooks();
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateWebhookDto: UpdateWebhookSubscriptionDto,
  ): Promise<WebhookSubscription> {
    return this.webhookService.updateWebhook(id, updateWebhookDto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<void> {
    return this.webhookService.deleteWebhook(id);
  }

  @Post(':id/trigger')
  async trigger(
    @Param('id') id: string,
    @Body() { event, data }: { event: string; data: Record<string, any> },
  ): Promise<void> {
    if (!event) {
      throw new BadRequestException('Event is required');
    }
    return this.webhookService.triggerWebhook(event, data, id);
  }
}
