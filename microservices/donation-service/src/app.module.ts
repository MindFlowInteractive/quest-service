import { Module } from '@nestjs/common';
import { DonationController } from './donation/donation.controller';
import { DonationService } from './donation/donation.service';

@Module({
  controllers: [DonationController],
  providers: [DonationService],
})
export class AppModule {}
