import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { MarketplaceService } from './marketplace.service';

@Controller()
export class MarketplaceController {
  constructor(private readonly svc: MarketplaceService) {}

  @Post('listings')
  createListing(@Body() body: { nftId: string; sellerId: string; price: number; currency?: string; royaltyPercent?: number; creatorId: string; auctionDurationMs?: number }) {
    return this.svc.createListing(body.nftId, body.sellerId, body.price, body.currency, body.royaltyPercent, body.creatorId, body.auctionDurationMs);
  }

  @Get('listings')
  listActive() {
    return this.svc.listActive();
  }

  @Get('listings/:id')
  getListing(@Param('id') id: string) {
    return this.svc.getListing(id);
  }

  @Post('listings/:id/cancel')
  cancelListing(@Param('id') id: string, @Body() body: { sellerId: string }) {
    return this.svc.cancelListing(id, body.sellerId);
  }

  @Post('listings/:id/buy')
  buy(@Param('id') id: string, @Body() body: { buyerId: string }) {
    return this.svc.buy(id, body.buyerId);
  }

  @Post('offers')
  makeOffer(@Body() body: { listingId: string; buyerId: string; amount: number }) {
    return this.svc.makeOffer(body.listingId, body.buyerId, body.amount);
  }

  @Post('offers/:id/respond')
  respondOffer(@Param('id') id: string, @Body() body: { action: 'accept' | 'reject' | 'counter'; counterAmount?: number }) {
    return this.svc.respondOffer(id, body.action, body.counterAmount);
  }

  @Post('listings/:id/bid')
  placeBid(@Param('id') id: string, @Body() body: { bidderId: string; amount: number }) {
    return this.svc.placeBid(id, body.bidderId, body.amount);
  }

  @Post('listings/:id/settle')
  settleAuction(@Param('id') id: string) {
    return this.svc.settleAuction(id);
  }

  @Get('nfts/:nftId/price-history')
  priceHistory(@Param('nftId') nftId: string) {
    return this.svc.getPriceHistory(nftId);
  }

  @Get('collections/:creatorId/stats')
  collectionStats(@Param('creatorId') creatorId: string) {
    return this.svc.getCollectionStats(creatorId);
  }
}
