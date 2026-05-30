import { Module } from '@nestjs/common';
import { RateLimitController } from './rate-limit/rate-limit.controller';
import { RateLimitService } from './rate-limit/rate-limit.service';

@Module({
  controllers: [RateLimitController],
  providers: [RateLimitService],
})
export class AppModule {}
