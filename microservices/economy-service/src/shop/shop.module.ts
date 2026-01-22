import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShopItem } from './shop-item.entity';
import { ShopService } from './shop.service';
import { ShopController } from './shop.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ShopItem])],
  controllers: [ShopController],
  providers: [ShopService],
  exports: [ShopService],
})
export class ShopModule {}
