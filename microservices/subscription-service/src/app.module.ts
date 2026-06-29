import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionController } from './subscription/subscription.controller';
import { SubscriptionService } from './subscription/subscription.service';
import { Subscription } from './subscription/subscription.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [Subscription],
      synchronize: false,
    }),
    TypeOrmModule.forFeature([Subscription]),
  ],
  controllers: [SubscriptionController],
  providers: [SubscriptionService],
})
export class AppModule {}