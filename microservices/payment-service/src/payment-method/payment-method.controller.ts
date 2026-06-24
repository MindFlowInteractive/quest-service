import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PaymentMethodService } from './payment-method.service';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';

@Controller('payment-methods')
export class PaymentMethodController {
  constructor(private readonly paymentMethodService: PaymentMethodService) {}

  @Post()
  createPaymentMethod(@Body() dto: CreatePaymentMethodDto) {
    return this.paymentMethodService.createPaymentMethod(dto);
  }

  @Get('user/:userId')
  getPaymentMethodsByUser(@Param('userId') userId: string) {
    return this.paymentMethodService.findByUser(userId);
  }

  @Get(':id')
  getPaymentMethod(@Param('id') id: string) {
    return this.paymentMethodService.findById(id);
  }

  @Post(':id/default')
  @HttpCode(HttpStatus.OK)
  setDefault(
    @Param('id') id: string,
    @Body() body: { userId: string },
  ) {
    return this.paymentMethodService.setDefault(id, body.userId);
  }

  @Post(':id/deactivate')
  @HttpCode(HttpStatus.OK)
  deactivate(
    @Param('id') id: string,
    @Body() body: { userId: string },
  ) {
    return this.paymentMethodService.deactivate(id, body.userId);
  }
}
