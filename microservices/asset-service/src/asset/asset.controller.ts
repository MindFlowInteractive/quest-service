import { Controller, Get, Post, Delete, Patch, Body, Param, Query } from '@nestjs/common';
import { AssetService } from './asset.service';

@Controller('assets')
export class AssetController {
  constructor(private readonly service: AssetService) {}

  @Get('owner/:ownerId')
  findByOwner(@Param('ownerId') ownerId: string) {
    return this.service.findByOwner(ownerId);
  }

  @Get('marketplace/listings')
  findListings(
    @Query('ownerId') ownerId?: string,
    @Query('assetId') assetId?: string,
    @Query('status') status?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
  ) {
    return this.service.findListings({ ownerId, assetId, status, minPrice, maxPrice });
  }

  @Get('marketplace/analytics')
  getMarketplaceAnalytics() {
    return this.service.getMarketplaceAnalytics();
  }

  @Get('marketplace/history/:assetId')
  getTradingHistory(@Param('assetId') assetId: string) {
    return this.service.getTradingHistory(assetId);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Post()
  register(@Body() body: { ownerId: string; filename: string; mimeType: string; sizeBytes: number }) {
    return this.service.register(body.ownerId, body.filename, body.mimeType, body.sizeBytes);
  }

  @Post('marketplace/listings')
  createListing(
    @Body() body: { sellerId: string; assetId: string; price: number; currency?: string; expiresAt?: string },
  ) {
    return this.service.createListing(body.sellerId, body.assetId, body.price, body.currency, body.expiresAt);
  }

  @Post('marketplace/listings/:listingId/offers')
  createOffer(
    @Param('listingId') listingId: string,
    @Body() body: { buyerId: string; amount: number; message?: string },
  ) {
    return this.service.createOffer(listingId, body.buyerId, body.amount, body.message);
  }

  @Patch('marketplace/offers/:offerId/accept')
  acceptOffer(@Param('offerId') offerId: string, @Body() body: { actorId: string }) {
    return this.service.acceptOffer(offerId, body.actorId);
  }

  @Patch('marketplace/offers/:offerId/reject')
  rejectOffer(@Param('offerId') offerId: string, @Body() body: { actorId: string }) {
    return this.service.rejectOffer(offerId, body.actorId);
  }

  @Patch('marketplace/listings/:listingId/cancel')
  cancelListing(@Param('listingId') listingId: string, @Body() body: { actorId: string }) {
    return this.service.cancelListing(listingId, body.actorId);
  }

  @Post('marketplace/escrow/:escrowId/release')
  releaseEscrow(@Param('escrowId') escrowId: string, @Body() body: { actorId: string }) {
    return this.service.releaseEscrow(escrowId, body.actorId);
  }


  @Post('marketplace/disputes')
  openDispute(
    @Body() body: { escrowId: string; openedBy: string; reason: string },
  ) {
    return this.service.openDispute(body.escrowId, body.openedBy, body.reason);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}