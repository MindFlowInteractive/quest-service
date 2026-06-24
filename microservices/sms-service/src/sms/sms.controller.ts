import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { MessageStatus } from './entities/message.entity';
import { SmsService } from './sms.service';
import {
  DeliveryReceiptDto,
  GenerateOtpDto,
  SendSmsDto,
  SendTemplatedSmsDto,
  VerifyOtpDto,
} from './dto';
import { TemplatesService } from '../templates/templates.service';

@Controller()
export class SmsController {
  constructor(
    private readonly smsService: SmsService,
    private readonly templatesService: TemplatesService,
  ) {}

  @Get('health')
  health() {
    return { status: 'ok', service: 'sms-service' };
  }

  @Post('sms/send')
  send(@Body() dto: SendSmsDto) {
    return this.smsService.send(dto);
  }

  @Post('sms/send-template')
  sendTemplated(@Body() dto: SendTemplatedSmsDto) {
    return this.smsService.sendTemplated(dto);
  }

  @Post('sms/otp')
  generateOtp(@Body() dto: GenerateOtpDto) {
    return this.smsService.generateOtp(dto);
  }

  @Post('sms/otp/verify')
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.smsService.verifyOtp(dto);
  }

  @Post('sms/receipts')
  receipt(@Body() dto: DeliveryReceiptDto) {
    return this.smsService.recordReceipt(dto);
  }

  @Get('sms/:id')
  findOne(@Param('id') id: string) {
    return this.smsService.findOne(id);
  }

  @Get('sms')
  history(
    @Query('userId') userId?: string,
    @Query('phone') phone?: string,
    @Query('status') status?: MessageStatus,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit?: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset?: number,
  ) {
    return this.smsService.history({
      userId,
      phone,
      status,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      limit,
      offset,
    });
  }

  @Get('sms-analytics')
  analytics(
    @Query('userId') userId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.smsService.analytics({
      userId,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

  @Post('sms/:id/cancel')
  cancel(@Param('id') id: string) {
    return this.smsService.cancel(id);
  }

  @Get('sms-templates')
  templates() {
    return this.templatesService.list();
  }
}
