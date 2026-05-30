import { Module } from '@nestjs/common';
import { MarketplaceController } from './marketplace/marketplace.controller';
import { MarketplaceService } from './marketplace/marketplace.service';

@Module({
  controllers: [MarketplaceController],
  providers: [MarketplaceService],
})
export class AppModule {}
