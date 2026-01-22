import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PaymentService, PaymentData } from './payment.service';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get('providers')
  getAvailableProviders() {
    return {
      providers: this.paymentService.getAvailableProviders(),
    };
  }

  @Post(':provider/process')
  @HttpCode(HttpStatus.OK)
  async processPayment(
    @Body() paymentData: PaymentData,
    @Param('provider') provider: string,
  ) {
    return this.paymentService.processPayment(provider, paymentData);
  }

  @Post(':provider/refund')
  @HttpCode(HttpStatus.OK)
  async refundPayment(
    @Body() body: { transactionId: string },
    @Param('provider') provider: string,
  ) {
    return this.paymentService.refundPayment(provider, body.transactionId);
  }
}
