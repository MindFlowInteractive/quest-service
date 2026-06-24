import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BackOrder } from './entities/back-order.entity';
import { BackOrderService } from './back-order.service';
import { BackOrderController } from './back-order.controller';
import { StockModule } from '../stock/stock.module';
import { InventoryModule } from '../inventory/inventory.module';
import { Stock } from '../stock/entities/stock.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BackOrder, Stock]), StockModule, InventoryModule],
  providers: [BackOrderService],
  controllers: [BackOrderController],
  exports: [BackOrderService],
})
export class BackOrderModule {}