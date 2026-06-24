import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { ProcessPaymentDto, RefundPaymentDto } from './dto/process-payment.dto';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get('providers')
  getAvailableProviders() {
    return { providers: this.paymentService.getAvailableProviders() };
  }

  @Get('user/:userId')
  getPaymentsByUser(@Param('userId') userId: string) {
    return this.paymentService.findByUser(userId);
  }

  @Get(':id')
  getPayment(@Param('id') id: string) {
    return this.paymentService.findById(id);
  }

  @Post(':provider/process')
  @HttpCode(HttpStatus.OK)
  processPayment(
    @Param('provider') provider: string,
    @Body() dto: ProcessPaymentDto,
  ) {
    return this.paymentService.processPayment(provider, dto);
  }

  @Post(':provider/refund')
  @HttpCode(HttpStatus.OK)
  refundPayment(
    @Param('provider') provider: string,
    @Body() dto: RefundPaymentDto,
  ) {
    return this.paymentService.refundPayment(provider, dto);
  }
}
