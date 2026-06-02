import { Module } from '@nestjs/common';
import { RatingsService } from './ratings.service';
import { RatingsController } from './ratings.controller';

@Module({
  providers: [RatingsService],
  controllers: [RatingsController]
})
export class RatingsModule {}
