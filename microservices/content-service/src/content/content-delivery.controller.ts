import { BadRequestException, Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ContentType } from '../entities/content.entity.js';
import { ContentDeliveryService } from './content-delivery.service.js';

@Controller('content/delivery')
export class ContentDeliveryController {
  constructor(private readonly deliveryService: ContentDeliveryService) {}

  @Get('manifest')
  getManifest(
    @Query('updatedSince') updatedSince?: string,
    @Query('contentType') contentType?: string,
  ) {
    if (contentType && !Object.values(ContentType).includes(contentType as ContentType)) {
      throw new BadRequestException('contentType is invalid');
    }
    return this.deliveryService.getManifest({ updatedSince, contentType: contentType as ContentType | undefined });
  }

  @Get('bundle')
  getBundle(@Query('ids') ids?: string) {
    return this.deliveryService.getBundle(this.parseIds(ids));
  }

  @Get('prefetch')
  prefetch(@Query('ids') ids?: string) {
    return this.deliveryService.getBundle(this.parseIds(ids), true);
  }

  @Get('analytics')
  getAnalytics(@Query('since') since?: string) {
    return this.deliveryService.getAnalytics(since);
  }

  @Get(':id')
  getContent(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('sinceVersion') sinceVersion?: string,
  ) {
    if (sinceVersion !== undefined && !/^\d+$/.test(sinceVersion)) {
      throw new BadRequestException('sinceVersion must be a positive integer');
    }
    return this.deliveryService.getContent(id, sinceVersion === undefined ? undefined : Number(sinceVersion));
  }

  private parseIds(ids?: string): string[] {
    if (!ids) {
      throw new BadRequestException('ids is required');
    }
    return ids.split(',');
  }
}