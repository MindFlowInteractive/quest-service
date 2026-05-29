import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoyaltyController } from './loyalty/loyalty.controller';
import { LoyaltyService } from './loyalty/loyalty.service';
import { LoyaltyPoints } from './loyalty/loyalty.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [LoyaltyPoints],
      synchronize: false,
    }),
    TypeOrmModule.forFeature([LoyaltyPoints]),
  ],
  controllers: [LoyaltyController],
  providers: [LoyaltyService],
})
export class AppModule {}