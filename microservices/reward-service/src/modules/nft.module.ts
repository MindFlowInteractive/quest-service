import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { NFT } from '../entities/nft.entity';
import { NFTService } from '../services/nft.service';
import { NFTController } from '../controllers/nft.controller';
import { StellarService } from '../services/stellar.service';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([NFT]),
  ],
  controllers: [NFTController],
  providers: [NFTService, StellarService],
  exports: [NFTService],
})
export class NFTModule {}