import { Module } from '@nestjs/common';
import { SponsorshipController } from './sponsorship.controller';
import { SponsorshipService } from './sponsorship.service';

@Module({
  controllers: [SponsorshipController],
  providers: [SponsorshipService]
})
export class AppModule {}
