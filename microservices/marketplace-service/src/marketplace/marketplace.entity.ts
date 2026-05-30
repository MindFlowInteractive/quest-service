export interface Listing {
  id: string;
  nftId: string;
  sellerId: string;
  price: number;
  currency: string;
  royaltyPercent: number;
  creatorId: string;
  status: 'active' | 'sold' | 'cancelled';
  auctionEndsAt?: number;
  highestBid?: number;
  highestBidder?: string;
  createdAt: number;
}

export interface Offer {
  id: string;
  listingId: string;
  buyerId: string;
  amount: number;
  status: 'pending' | 'accepted' | 'rejected' | 'countered';
  counterAmount?: number;
  createdAt: number;
}

export interface Transaction {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  nftId: string;
  price: number;
  royaltyPaid: number;
  creatorId: string;
  executedAt: number;
}

export interface PriceHistory {
  nftId: string;
  price: number;
  at: number;
}
