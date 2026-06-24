import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PaymentModule } from './payment/payment.module';
import { InvoiceModule } from './invoice/invoice.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { PaymentMethodModule } from './payment-method/payment-method.module';
import { WebhookModule } from './webhook/webhook.module';
import {
  Payment,
  Invoice,
  Subscription,
  PaymentMethod,
} from './entities';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT ?? '5432', 10),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'payment_db',
      entities: [Payment, Invoice, Subscription, PaymentMethod],
      synchronize: process.env.NODE_ENV !== 'production',
      autoLoadEntities: true,
    }),
    PaymentModule,
    InvoiceModule,
    SubscriptionModule,
    PaymentMethodModule,
    WebhookModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
