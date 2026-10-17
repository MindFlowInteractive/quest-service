import { Injectable, NotFoundException, BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Asset } from './asset.entity';

export type AssetStatus = 'active' | 'listed' | 'escrow' | 'deleted';

export interface MarketplaceListing {
  id: string;
  assetId: string;
  sellerId: string;
  price: number;
  currency: string;
  status: 'open' | 'sold' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export interface MarketplaceOffer {
  id: string;
  listingId: string;
  buyerId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export interface EscrowRecord {
  id: string;
  listingId: string;
  assetId: string;
  sellerId: string;
  buyerId: string;
  amount: number;
  currency: string;
  status: 'held' | 'released' | 'refunded' | 'disputed';
  createdAt: Date;
  updatedAt: Date;
}

export interface TradingHistoryEntry {
  id: string;
  listingId: string;
  assetId: string;
  sellerId: string;
  buyerId: string;
  amount: number;
  currency: string;
  type: 'listing' | 'offer' | 'escrow_release' | 'escrow_refund' | 'dispute';
  createdAt: Date;
}

export interface DisputeRecord {
  id: string;
  escrowId: string;
  openedEyBy: string;
  reason: string;
  status: 'open' | 'resolved_release' | 'resolved_refund';
  createdAt: Date;
  resolvedAt?: Date;
}

export interface MarketplaceAnalytics {
  totalListings: number;
  openListings: number;
  soldListings: number;
  totalOffers: number;
  acceptedOffers: number;
  totalTrades: number;
  totalVolume: number;
  averagePrice: number;
  openDisputes: number;
}

@Injectable()
export class AssetService {
  private readonly listings = new Map<string, MarketplaceListing>();
  private readonly offers = new Map<string, MarketplaceOffer>();
  private readonly escrows = new Map<string, EscrowRecord>();
  private readonly history: TradingHistoryEntry[] = [];
  private readonly disputes = new Map<string, DisputeRecord>();
  private sequence = 0;

  constructor(
    @InjectRepository(Asset)
    private readonly repo: Repository<Asset>,
  ) {}

  findByOwner(ownerId: string): Promise<Asset[]> {
    return this.repo.find({ where: { ownerId, status: 'active' } });
  }

  findById(id: string): Promise<Asset | null> {
    return this.repo.findOne({ where: { id } });
  }

  register(ownerId: string, filename: string, mimeType: string, sizeBytes: number): Promise<Asset> {
    const asset = this.repo.create({ ownerId, filename, mimeType, sizeBytes });
    return this.repo.save(asset);
  }

  async delete(id: string): Promise<void> {
    await this.repo.update(id, { status: 'deleted' });
  }

  // --- Marketplace ---

  async createListing(ownerId: string, assetId: string, price: number, currency = 'gold'): Promise<MarketplaceListing> {
    if (!Number.isFinite(price) || price <= 0) {
      throw new BadRequestException('Price must be a positive number');
    }
    const asset = await this.repo.findOne({ where: { id: assetId } });
    if (!asset) {
      throw new NotFoundException('Asset not found');
    }
    if (asset.ownerId !== ownerId) {
      throw new ForbiddenException('Only the asset owner can list it');
    }
    if (asset.status !== 'active') {
      throw new ConflictException('Asset is not available for listing');
    }
    const existing = [...this.listings.values()].find((l) => l.assetId === assetId && l.status === 'open');
    if (existing) {
      throw new ConflictException('Asset already has an open listing');
    }
    const now = new Date();
    const listing: MarketplaceListing = {
      id: this.nextId('lst'),
      assetId,
      sellerId: ownerId,
      price,
      currency,
      status: 'open',
      createdAt: now,
      updatedAt: now,
    };
    this.listings.set(listing.id, listing);
    await this.repo.update(assetId, { status: 'listed' });
    this.recordHistory({
      listingId: listing.id,
      assetId: assetId,
      sellerId: ownerId,
      buyerId: '',
      amount: price,
      currency,
      type: 'listing',
    });
    return listing;
  }

  async cancelListing(ownerId: string, listingId: string): Promise<MarketplaceListing> {
    const listing = this.requireListing(listingId);
    if (listing.sellerId !== ownerId) {
      throw new ForbiddenException('Only the seller can cancel this listing');
    }
    if (listing.status !== 'open') {
      throw new ConflictException('Listing is not open');
    }
    listing.status = 'cancelled';
    listing.updatedAt = new Date();
    await this.repo.update(listing.assetId, { status: 'active' });
    return listing;
  }

  // --- Offers ---

  async createOffer(buyerId: string, listingId: string, amount: number, currency?: string): Promise<MarketplaceOffer> {
    const listing = this.requireListing(listingId);
    if (listing.status !== 'open') {
      throw new ConflictException('Listing is not open');
    }
    if (listing.sellerId === buyerId) {
      throw new BadRequestException('Seller cannot offer on own listing');
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('Offer amount must be positive');
    }
    const now = new Date();
    const offer: MarketplaceOffer = {
      id: this.nextId('off'),
      listingId,
      buyerId,
      amount,
      currency: currency ?? listing.currency,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };
    this.offers.set(offer.id, offer);
    return offer;
  }

  async acceptOffer(sellerId: string, offerId: string): Promise<EscrowRecord> {
    const offer = this.requireOffer(offerId);
    const listing = this.requireListing(offer.listingId);
    if (listing.sellerId !== sellerId) {
      throw new ForbiddenException('Only the seller can accept an offer');
    }
    if (offer.status !== 'pending') {
      throw new ConflictException('Offer is not pending');
    }
    if (listing.status !== 'open') {
      throw new ConflictException('Listing is not open');
    }
    offer.status = 'accepted';
    offer.updatedAt = new Date();
    for (const other of this.offers.values()) {
      if (other.listingId === listing.id && other.id !== offer.id && other.status === 'pending') {
        other.status = 'rejected';
        other.updatedAt = new Date();
      }
    }
    listing.status = 'sold';
    listing.updatedAt = new Date();
    await this.repo.update(listing.assetId, { status: 'escrow' });
    const escrow = this.createEscrow(listing, offer);
    this.recordHistory({
      listingId: listing.id,
      assetId: listing.assetId,
      sellerId: listing.sellerId,
      buyerId: offer.buyerId,
      amount: offer.amount,
      currency: offer.currency,
      type: 'offer',
    });
    return escrow;
  }

  async rejectOffer(sellerId: string, offerId: string): Promise<MarketplaceOffer> {
    const offer = this.requireOffer(offerId);
    const listing = this.requireListing(offer.listingId);
    if (listing.sellerId !== sellerId) {
      throw new ForbiddenException('Only the seller can reject an offer');
    }
    if (offer.status !== 'pending') {
      throw new ConflictException('Offer is not pending');
    }
    offer.status = 'rejected';
    offer.updatedAt = new Date();
    return offer;
  }

  // --- Escrow ---

  private createEscrow(listing: MarketplaceListing, offer: MarketplaceOffer): EscrowRecord {
    const now = new Date();
    const escrow: EscrowRecord = {
      id: this.nextId('esc'),
      listingId: listing.id,
      assetId: listing.assetId,
      sellerId: listing.sellerId,
      buyerId: offer.buyerId,
      amount: offer.amount,
      currency: offer.currency,
      status: 'held',
      createdAt: now,
      updatedAt: now,
    };
    this.escrows.set(escrow.id, escrow);
    return escrow;
  }

  async releaseEscrow(requesterId: string, escrowId: string): Promise<EscrowRecord> {
    const escrow = this.requireEscrow(escrowId);
    if (escrow.status !== 'held') {
      throw new ConflictException('Escrow is not in held state');
    }
    if (requesterId !== escrow.buyerId && requesterId !== escrow.sellerId) {
      throw new ForbiddenException('Not a participant of this escrow');
    }
    escrow.status = 'released';
    escrow.updatedAt = new Date();
    await this.repo.update(escrow.assetId, { ownerId: escrow.buyerId, status: 'active' });
    this.recordHistory({
      listingId: escrow.listingId,
      assetId: escrow.assetId,
      sellerId: escrow.sellerId,
      buyerId: escrow.buyerId,
      amount: escrow.amount,
      currency: escrow.currency,
      type: 'escrow_release',
    });
    return escrow;
  }

  async refundEscrow(requesterId: string, escrowId: string): Promise<EscrowRecord> {
    const escrow = this.requireEscrow(escrowId);
    if (escrow.status !== 'held' && escrow.status !== 'disputed') {
      throw new ConflictException('Escrow cannot be refunded');
    }
    if (requesterId !== escrow.buyerId && requesterId !== escrow.sellerId) {
      throw new ForbiddenException('Not a participant of this escrow');
    }
    escrow.status = 'refunded';
    escrow.updatedAt = new Date();
    await this.repo.update(escrow.assetId, { ownerId: escrow.sellerId, status: 'active' });
    this.recordHistory({
      listingId: escrow.listingId,
      assetId: escrow.assetId,
      sellerId: escrow.sellerId,
      buyerId: escrow.buyerId,
      amount: escrow.amount,
      currency: escrow.currency,
      type: 'escrow_refund',
    });
    return escrow;
  }

  // --- Disputes ---

  async openDispute(requesterId: string, escrowId: string, reason: string): Promise<DisputeRecord> {
    const escrow = this.requireEscrow(escrowId);
    if (requesterId !== escrow.buyerId && requesterId !== escrow.sellerId) {
      throw new ForbiddenException('Not a participant of this escrow');
    }
    if (escrow.status !== 'held') {
      throw new ConflictException('Escrow is not in held state');
    }
    if (!reason || !reason.trim()) {
      throw new BadRequestException('Dispute reason is required');
    }
    escrow.status = 'disputed';
    escrow.updatedAt = new Date();
    const dispute: DisputeRecord = {
      id: this.nextId('dsp'),
      escrowId,
      openedEyBy: requesterId,
      reason: reason.trim(),
      status: 'open',
      createdAt: new Date(),
    };
    this.disputes.set(dispute.id, dispute);
    this.recordHistory({
      listingId: escrow.listingId,
      assetId: escrow.assetId,
      sellerId: escrow.sellerId,
      buyerId: escrow.buyerId,
      amount: escrow.amount,
      currency: escrow.currency,
      type: 'dispute',
    });
    return dispute;
  }

  async resolveDispute(resolverId: string, disputeId: string, resolution: 'release' | 'refund'): Promise<DisputeRecord> {
    const dispute = this.disputes.get(disputeId);
    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }
    if (dispute.status !== 'open') {
      throw new ConflictException('Dispute is already resolved');
    }
    const escrow = this.requireEscrow(dispute.escrowId);
    if (resolverId !== escrow.buyerId && resolverId !== escrow.sellerId) {
      throw new ForbiddenException('Not a participant of this escrow');
    }
    if (resolution === 'release') {
      await this.releaseEscrow(resolverId, escrow.id);
      dispute.status = 'resolved_release';
    } else if (resolution === 'refund') {
      await this.refundEscrow(resolverId, escrow.id);
      dispute.status = 'resolved_refund';
    } else {
      throw new BadRequestException('Invalid resolution');
    }
    dispute.resolvedAt = new Date();
    return dispute;
  }

  // --- Search & filtering ---

  searchListings(filters: {
    sellerId?: string;
    currency?: string;
    minPrice?: number;
    maxPrice?: number;
    status?: MarketplaceListing['status'];
  } = {}): MarketplaceListing[] {
    return [...this.listings.values()].filter((l) => {
      if (filters.sellerId && l.sellerId !== filters.sellerId) return false;
      if (filters.currency && l.currency !== filters.currency) return false;
      if (filters.minPrice !== undefined && l.price < filters.minPrice) return false;
      if (filters.maxPrice !== undefined && l.price > filters.maxPrice) return false;
      if (filters.status && l.status !== filters.status) return false;
      return true;
    });
  }

  findListings(filters: {
    ownerId?: string;
    assetId?: string;
    status?: string;
    minPrice?: string;
    maxPrice?: string;
  } = {}): MarketplaceListing[] {
    const minPrice = filters.minPrice !== undefined ? Number(filters.minPrice) : undefined;
    const maxPrice = filters.maxPrice !== undefined ? Number(filters.maxPrice) : undefined;
    return [...this.listings.values()].filter((l) => {
      if (filters.ownerId && l.sellerId !== filters.ownerId) return false;
      if (filters.assetId && l.assetId !== filters.assetId) return false;
      if (filters.status && l.status !== filters.status) return false;
      if (minPrice !== undefined && !Number.isNaN(minPrice) && l.price < minPrice) return false;
      if (maxPrice !== undefined && !Number.isNaN(maxPrice) && l.price > maxPrice) return false;
      return true;
    });
  }

  getTradingHistory(assetId: string): TradingHistoryEntry[] {
    return this.history.filter((h) => h.assetId === assetId);
  }

  getMarketplaceAnalytics(): MarketplaceAnalytics {
    const listings = [...this.listings.values()];
    const offers = [...this.offers.values()];
    const trades = this.history.filter((h) => h.type === 'escrow_release');
    const totalVolume = trades.reduce((sum, t) => sum + t.amount, 0);
    return {
      totalListings: listings.length,
      openListings: listings.filter((l) => l.status === 'open').length,
      soldListings: listings.filter((l) => l.status === 'sold').length,
      totalOffers: offers.length,
      acceptedOffers: offers.filter((o) => o.status === 'accepted').length,
      totalTrades: trades.length,
      totalVolume,
      averagePrice: trades.length > 0 ? totalVolume / trades.length : 0,
      openDisputes: [...this.disputes.values()].filter((d) => d.status === 'open').length,
    };
  }

  // --- Internal helpers ---

  private nextId(prefix: string): string {
    this.sequence += 1;
    return `${prefix}_${this.sequence.toString().padStart(6, '0')}`;
  }

  private recordHistory(entry: Omit<TradingHistoryEntry, 'id' | 'createdAt'>): void {
    this.history.push({
      id: this.nextId('hst'),
      createdAt: new Date(),
      ...entry,
    });
  }

  private requireListing(listingId: string): MarketplaceListing {
    const listing = this.listings.get(listingId);
    if (!listing) {
      throw new NotFoundException('Listing not found');
    }
    return listing;
  }

  private requireOffer(offerId: string): MarketplaceOffer {
    const offer = this.offers.get(offerId);
    if (!offer) {
      throw new NotFoundException('Offer not found');
    }
    return offer;
  }

  private requireEscrow(escrowId: string): EscrowRecord {
    const escrow = this.escrows.get(escrowId);
    if (!escrow) {
      throw new NotFoundException('Escrow not found');
    }
    return escrow;
  }
}
