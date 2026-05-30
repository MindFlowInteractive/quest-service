import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Listing, Offer, Transaction, PriceHistory } from './marketplace.entity';

let seq = 1;
const uid = () => String(seq++);

@Injectable()
export class MarketplaceService {
  private listings = new Map<string, Listing>();
  private offers = new Map<string, Offer>();
  private transactions = new Map<string, Transaction>();
  private priceHistory: PriceHistory[] = [];

  // --- Listings ---
  createListing(nftId: string, sellerId: string, price: number, currency = 'XLM', royaltyPercent = 5, creatorId: string, auctionDurationMs?: number): Listing {
    const id = uid();
    const listing: Listing = {
      id, nftId, sellerId, price, currency, royaltyPercent, creatorId,
      status: 'active',
      auctionEndsAt: auctionDurationMs ? Date.now() + auctionDurationMs : undefined,
      createdAt: Date.now(),
    };
    this.listings.set(id, listing);
    return listing;
  }

  getListing(id: string): Listing {
    const l = this.listings.get(id);
    if (!l) throw new NotFoundException('Listing not found');
    return l;
  }

  listActive(): Listing[] {
    return [...this.listings.values()].filter(l => l.status === 'active');
  }

  cancelListing(id: string, sellerId: string): Listing {
    const l = this.getListing(id);
    if (l.sellerId !== sellerId) throw new BadRequestException('Not the seller');
    l.status = 'cancelled';
    return l;
  }

  // --- Buy (escrow simulation) ---
  buy(listingId: string, buyerId: string): Transaction {
    const l = this.getListing(listingId);
    if (l.status !== 'active') throw new BadRequestException('Listing not active');
    if (l.auctionEndsAt && Date.now() < l.auctionEndsAt) throw new BadRequestException('Auction still running');

    const royaltyPaid = Math.round(l.price * l.royaltyPercent) / 100;
    const tx: Transaction = {
      id: uid(), listingId, buyerId, sellerId: l.sellerId,
      nftId: l.nftId, price: l.price, royaltyPaid, creatorId: l.creatorId,
      executedAt: Date.now(),
    };
    this.transactions.set(tx.id, tx);
    l.status = 'sold';
    this.priceHistory.push({ nftId: l.nftId, price: l.price, at: tx.executedAt });
    return tx;
  }

  // --- Offers ---
  makeOffer(listingId: string, buyerId: string, amount: number): Offer {
    this.getListing(listingId); // validate exists
    const offer: Offer = { id: uid(), listingId, buyerId, amount, status: 'pending', createdAt: Date.now() };
    this.offers.set(offer.id, offer);
    return offer;
  }

  respondOffer(offerId: string, action: 'accept' | 'reject' | 'counter', counterAmount?: number): Offer {
    const o = this.offers.get(offerId);
    if (!o) throw new NotFoundException('Offer not found');
    if (action === 'counter' && counterAmount) {
      o.status = 'countered';
      o.counterAmount = counterAmount;
    } else {
      o.status = action === 'accept' ? 'accepted' : 'rejected';
    }
    if (o.status === 'accepted') {
      const l = this.getListing(o.listingId);
      l.price = o.amount;
      this.buy(o.listingId, o.buyerId);
    }
    return o;
  }

  // --- Auction bid ---
  placeBid(listingId: string, bidderId: string, amount: number): Listing {
    const l = this.getListing(listingId);
    if (!l.auctionEndsAt) throw new BadRequestException('Not an auction');
    if (Date.now() > l.auctionEndsAt) throw new BadRequestException('Auction ended');
    if (l.highestBid && amount <= l.highestBid) throw new BadRequestException('Bid too low');
    l.highestBid = amount;
    l.highestBidder = bidderId;
    return l;
  }

  settleAuction(listingId: string): Transaction {
    const l = this.getListing(listingId);
    if (!l.auctionEndsAt || Date.now() < l.auctionEndsAt) throw new BadRequestException('Auction not ended');
    if (!l.highestBidder) throw new BadRequestException('No bids');
    l.price = l.highestBid!;
    return this.buy(listingId, l.highestBidder);
  }

  // --- Price history & stats ---
  getPriceHistory(nftId: string): PriceHistory[] {
    return this.priceHistory.filter(p => p.nftId === nftId);
  }

  getCollectionStats(creatorId: string): { totalSales: number; totalVolume: number; avgPrice: number } {
    const txs = [...this.transactions.values()].filter(t => t.creatorId === creatorId);
    const totalVolume = txs.reduce((s, t) => s + t.price, 0);
    return { totalSales: txs.length, totalVolume, avgPrice: txs.length ? totalVolume / txs.length : 0 };
  }
}
