import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { UnsubscribeService } from './unsubscribe.service';
import { CreateUnsubscribeDto, UnsubscribeByTokenDto, ResubscribeDto } from './dto';
import { EmailCategory } from './entities/email-unsubscribe.entity';

@Controller('unsubscribe')
export class UnsubscribeController {
  constructor(private readonly unsubscribeService: UnsubscribeService) {}

  @Post()
  async unsubscribe(@Body() dto: CreateUnsubscribeDto, @Req() req: Request) {
    return this.unsubscribeService.unsubscribe(dto, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  @Post('token')
  @HttpCode(HttpStatus.OK)
  async unsubscribeByToken(@Body() dto: UnsubscribeByTokenDto) {
    return this.unsubscribeService.unsubscribeByToken(dto.token, dto.category);
  }

  @Get('verify')
  async verifyUnsubscribe(@Query('token') token: string) {
    const result = await this.unsubscribeService.unsubscribeByToken(token);
    return {
      success: true,
      email: result.email,
      category: result.category,
    };
  }

  @Post('resubscribe')
  @HttpCode(HttpStatus.OK)
  async resubscribe(@Body() dto: ResubscribeDto) {
    const success = await this.unsubscribeService.resubscribe(dto);
    return { success };
  }

  @Get('status/:email')
  async getStatus(@Param('email') email: string) {
    return this.unsubscribeService.getUnsubscribeStatus(email);
  }

  @Get('user/:userId')
  async getByUserId(@Param('userId') userId: string) {
    return this.unsubscribeService.getByUserId(userId);
  }

  @Get('generate-link')
  async generateLink(
    @Query('email') email: string,
    @Query('userId') userId?: string,
  ) {
    const link = await this.unsubscribeService.generateUnsubscribeLink(email, userId);
    return { link };
  }

  @Get('check')
  async checkUnsubscribed(
    @Query('email') email: string,
    @Query('type') type: string,
  ) {
    const isUnsubscribed = await this.unsubscribeService.isUnsubscribed(email, type);
    return { isUnsubscribed };
  }

  @Get('bounces')
  async getBounces(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.unsubscribeService.getBounces(
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    );
  }

  @Get('complaints')
  async getComplaints(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.unsubscribeService.getComplaints(
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    );
  }
}
