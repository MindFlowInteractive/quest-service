export interface Charity {
  id: string;
  name: string;
  verified: boolean;
  totalReceived: number;
  impactDescription: string;
}

export interface Donation {
  id: string;
  donorId: string;
  charityId: string;
  amount: number;
  currency: string;
  recurring: boolean;
  intervalDays?: number;
  nextDueAt?: number;
  taxReceiptGenerated: boolean;
  createdAt: number;
}

export interface ImpactReport {
  charityId: string;
  totalDonations: number;
  totalAmount: number;
  donors: number;
}
