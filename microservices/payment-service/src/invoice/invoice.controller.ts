import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';

@Controller('invoices')
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Post()
  createInvoice(@Body() dto: CreateInvoiceDto) {
    return this.invoiceService.createInvoice(dto);
  }

  @Get('user/:userId')
  getInvoicesByUser(@Param('userId') userId: string) {
    return this.invoiceService.findByUser(userId);
  }

  @Get(':id')
  getInvoice(@Param('id') id: string) {
    return this.invoiceService.findById(id);
  }

  @Post(':id/send')
  @HttpCode(HttpStatus.OK)
  sendInvoice(@Param('id') id: string) {
    return this.invoiceService.markAsSent(id);
  }

  @Post(':id/pay')
  @HttpCode(HttpStatus.OK)
  payInvoice(
    @Param('id') id: string,
    @Body() body: { paymentId?: string },
  ) {
    return this.invoiceService.markAsPaid(id, body.paymentId);
  }
}
