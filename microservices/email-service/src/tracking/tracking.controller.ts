import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Res,
  Headers,
  Req,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { TrackingService, TrackingEventData } from './tracking.service';
import { TrackingEventType, BounceType } from './entities/email-tracking-event.entity';

@Controller('tracking')
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Get('pixel/:emailId')
  async trackOpenPixel(
    @Param('emailId') emailId: string,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    await this.trackingService.trackOpen({
      emailId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    const pixel = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64',
    );

    res.set({
      'Content-Type': 'image/gif',
      'Content-Length': pixel.length,
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    });

    res.send(pixel);
  }

  @Get('click/:emailId')
  async trackClick(
    @Param('emailId') emailId: string,
    @Query('url') url: string,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    await this.trackingService.trackClick({
      emailId,
      url: decodeURIComponent(url),
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.redirect(302, decodeURIComponent(url));
  }

  @Get('events/:emailId')
  async getEventsByEmail(@Param('emailId') emailId: string) {
    return this.trackingService.getEventsByEmail(emailId);
  }

  @Get('user/:userId')
  async getEventsByUser(
    @Param('userId') userId: string,
    @Query('type') type?: TrackingEventType,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.trackingService.getEventsByUser(userId, {
      type,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
  }

  @Get('stats')
  async getStats(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('provider') provider?: string,
  ) {
    return this.trackingService.getStats({
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      provider,
    });
  }

  @Get('bounces/stats')
  async getBounceStats(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.trackingService.getBounceStats(
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    );
  }
}
