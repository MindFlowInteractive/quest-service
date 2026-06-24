import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from '../entities/payment.entity';
import { StripePaymentProvider } from '../providers/stripe.provider';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Payment])],
  controllers: [PaymentController],
  providers: [PaymentService, StripePaymentProvider],
  exports: [PaymentService, StripePaymentProvider],
})
export class PaymentModule {}
