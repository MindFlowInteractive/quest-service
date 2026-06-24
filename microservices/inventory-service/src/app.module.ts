import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { InventoryModule } from './inventory/inventory.module';
import { StockModule } from './stock/stock.module';
import { ReservationModule } from './reservation/reservation.module';
import { BackOrderModule } from './back-order/back-order.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { ReconciliationModule } from './reconciliation/reconciliation.module';
import { Inventory } from './inventory/entities/inventory.entity';
import { Stock } from './stock/entities/stock.entity';
import { Reservation } from './reservation/entities/reservation.entity';
import { BackOrder } from './back-order/entities/back-order.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', 'postgres'),
        database: configService.get<string>('DB_NAME', 'inventory_service'),
        entities: [Inventory, Stock, Reservation, BackOrder],
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    InventoryModule,
    StockModule,
    ReservationModule,
    BackOrderModule,
    AnalyticsModule,
    ReconciliationModule,
  ],
})
export class AppModule {}