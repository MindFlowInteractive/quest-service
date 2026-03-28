import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ActiveUser } from '../auth/decorators/active-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WebhooksService } from './webhooks.service';
import { CreateWebhookDto } from './dto/create-webhook.dto';

@UseGuards(JwtAuthGuard)
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post()
  async create(
    @ActiveUser() user: { userId?: string; sub?: string; id?: string },
    @Body() createWebhookDto: CreateWebhookDto,
  ) {
    const webhook = await this.webhooksService.create(this.getOwnerId(user), createWebhookDto);
    return this.webhooksService.toResponse(webhook);
  }

  @Get()
  async findAll(
    @ActiveUser() user: { userId?: string; sub?: string; id?: string },
    @Query('appId') appId?: string,
  ) {
    const webhooks = await this.webhooksService.findAll(this.getOwnerId(user), appId);
    return webhooks.map((webhook) => this.webhooksService.toResponse(webhook));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @ActiveUser() user: { userId?: string; sub?: string; id?: string },
    @Param('id') id: string,
  ) {
    await this.webhooksService.remove(this.getOwnerId(user), id);
  }

  @Get(':id/deliveries')
  getDeliveries(
    @ActiveUser() user: { userId?: string; sub?: string; id?: string },
    @Param('id') id: string,
    @Query('limit', new DefaultValuePipe(100), ParseIntPipe) limit: number,
  ) {
    return this.webhooksService.getDeliveries(this.getOwnerId(user), id, limit);
  }

  private getOwnerId(user: { userId?: string; sub?: string; id?: string }): string {
    const ownerId = user?.userId ?? user?.sub ?? user?.id;

    if (!ownerId) {
      throw new UnauthorizedException('Authenticated user not found');
    }

    return ownerId;
  }
}