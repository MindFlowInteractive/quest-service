import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ConfirmReceiptDto } from './dto';
import { ReceiptsService } from './receipts.service';

@Controller('receipts')
export class ReceiptsController {
  constructor(private readonly receiptsService: ReceiptsService) {}

  @Post('confirm')
  confirm(@Body() dto: ConfirmReceiptDto) {
    return this.receiptsService.confirmReceipt(dto);
  }

  @Post('webhook')
  webhook(@Body() payload: ConfirmReceiptDto) {
    return this.receiptsService.confirmReceipt(payload);
  }

  @Get('message/:messageId')
  findByMessageId(@Param('messageId') messageId: string) {
    return this.receiptsService.findByMessageId(messageId);
  }
}
