import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Stock } from './entities/stock.entity';
import { StockService } from './stock.service';
import { StockController } from './stock.controller';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [TypeOrmModule.forFeature([Stock]), InventoryModule],
  providers: [StockService],
  controllers: [StockController],
  exports: [StockService],
})
export class StockModule {}