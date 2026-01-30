import { Module } from '@nestjs/common';
import { CacheService } from './cache.service';
import { CacheController } from './cache.controller';

@Module({
  providers: [CacheService],
  controllers: [CacheController],
  exports: [CacheService]
})
export class CacheModule {}
