import { Module } from '@nestjs/common';
import { ClansController } from './clans.controller';
import { ClansService } from './clans.service';

@Module({
  controllers: [ClansController],
  providers: [ClansService]
})
export class AppModule {}
