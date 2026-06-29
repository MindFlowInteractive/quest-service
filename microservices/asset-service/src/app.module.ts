import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetController } from './asset/asset.controller';
import { AssetService } from './asset/asset.service';
import { Asset } from './asset/asset.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [Asset],
      synchronize: false,
    }),
    TypeOrmModule.forFeature([Asset]),
  ],
  controllers: [AssetController],
  providers: [AssetService],
})
export class AppModule {}