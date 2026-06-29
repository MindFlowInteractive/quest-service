import { Controller, Get, Query } from '@nestjs/common';
import { MarketplaceService } from './marketplace.service';

@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @Get('mentors')
  async getMentors(@Query('specialty') specialty?: string) {
    if (specialty) {
      return this.marketplaceService.searchMentors(specialty);
    }
    return this.marketplaceService.getAvailableMentors();
  }
}
