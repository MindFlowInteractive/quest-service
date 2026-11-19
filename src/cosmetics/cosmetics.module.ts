import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { CosmeticItem } from './entities/cosmetic-item.entity';
import { PlayerCosmeticUnlock } from './entities/player-cosmetic-unlock.entity';
import { PlayerEquippedCosmetic } from './entities/player-equipped-cosmetic.entity';
import { CosmeticsController } from './cosmetics.controller';
import { CosmeticsService } from './cosmetics.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CosmeticItem,
      PlayerCosmeticUnlock,
      PlayerEquippedCosmetic,
    ]),
    AuthModule,
  ],
  controllers: [CosmeticsController],
  providers: [CosmeticsService],
  exports: [CosmeticsService],
})
export class CosmeticsModule {}
