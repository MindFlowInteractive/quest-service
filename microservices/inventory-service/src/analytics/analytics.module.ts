import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { Stock } from '../stock/entities/stock.entity';
import { Reservation } from '../reservation/entities/reservation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Stock, Reservation])],
  providers: [AnalyticsService],
  controllers: [AnalyticsController],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}