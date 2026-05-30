import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { DonationService } from './donation.service';

@Controller()
export class DonationController {
  constructor(private readonly svc: DonationService) {}

  @Post('charities')
  registerCharity(@Body() body: { name: string; impactDescription: string }) {
    return this.svc.registerCharity(body.name, body.impactDescription);
  }

  @Post('charities/:id/verify')
  verifyCharity(@Param('id') id: string) {
    return this.svc.verifyCharity(id);
  }

  @Get('charities')
  listCharities() {
    return this.svc.listCharities();
  }

  @Post('donations')
  donate(@Body() body: { donorId: string; charityId: string; amount: number; currency?: string; recurring?: boolean; intervalDays?: number }) {
    return this.svc.donate(body.donorId, body.charityId, body.amount, body.currency, body.recurring, body.intervalDays);
  }

  @Post('donations/:id/receipt')
  taxReceipt(@Param('id') id: string) {
    return this.svc.generateTaxReceipt(id);
  }

  @Get('donors/:donorId/history')
  donorHistory(@Param('donorId') donorId: string) {
    return this.svc.getDonorHistory(donorId);
  }

  @Get('charities/:id/impact')
  impact(@Param('id') id: string) {
    return this.svc.getImpactReport(id);
  }

  @Get('charities/:id/quadratic-match')
  quadraticMatch(@Param('id') id: string) {
    return this.svc.quadraticMatch(id);
  }
}
