import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { EmailsService } from './emails.service';
import { SendEmailDto, SendTemplatedEmailDto, SendBatchEmailDto } from './dto';
import { EmailStatus, EmailType } from './entities/email.entity';

@Controller('emails')
export class EmailsController {
  constructor(private readonly emailsService: EmailsService) {}

  @Post('send')
  async send(@Body() dto: SendEmailDto) {
    return this.emailsService.send(dto);
  }

  @Post('send-templated')
  async sendTemplated(@Body() dto: SendTemplatedEmailDto) {
    return this.emailsService.sendTemplated(dto);
  }

  @Post('send-batch')
  async sendBatch(@Body() dto: SendBatchEmailDto) {
    return this.emailsService.sendBatch(dto);
  }

  @Get('stats')
  async getStats(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('userId') userId?: string,
    @Query('type') type?: EmailType,
  ) {
    return this.emailsService.getStats({
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      userId,
      type,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.emailsService.findOne(id);
  }

  @Get('user/:userId')
  async findByUserId(
    @Param('userId') userId: string,
    @Query('status') status?: EmailStatus,
    @Query('type') type?: EmailType,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.emailsService.findByUserId(userId, {
      status,
      type,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
  }

  @Get('message/:messageId')
  async findByMessageId(@Param('messageId') messageId: string) {
    return this.emailsService.findByMessageId(messageId);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancel(@Param('id') id: string) {
    const cancelled = await this.emailsService.cancel(id);
    return { success: cancelled };
  }

  @Post(':id/retry')
  async retry(@Param('id') id: string) {
    return this.emailsService.retry(id);
  }
}
