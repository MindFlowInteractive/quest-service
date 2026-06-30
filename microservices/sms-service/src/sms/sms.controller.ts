import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { QuerySmsHistoryDto, SendSmsDto, SendTemplatedSmsDto } from './dto';
import { SmsMessageType } from './entities/sms-message.entity';
import { SmsService } from './sms.service';

@Controller('sms')
export class SmsController {
  constructor(private readonly smsService: SmsService) {}

  @Post('send')
  send(@Body() dto: SendSmsDto) {
    return this.smsService.send(dto);
  }

  @Post('send-templated')
  sendTemplated(@Body() dto: SendTemplatedSmsDto) {
    return this.smsService.sendTemplated(dto);
  }

  @Get('stats')
  getStats(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('userId') userId?: string,
    @Query('type') type?: SmsMessageType,
  ) {
    return this.smsService.getStats({ from, to, userId, type });
  }

  @Get('history')
  getHistory(@Query() query: QuerySmsHistoryDto) {
    return this.smsService.getHistory(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.smsService.findOne(id);
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.smsService.cancel(id);
  }

  @Post(':id/retry')
  retry(@Param('id') id: string) {
    return this.smsService.retry(id);
  }
}
