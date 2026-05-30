import { Injectable, NotFoundException } from '@nestjs/common';
import { Charity, Donation, ImpactReport } from './donation.entity';

let idSeq = 1;
const uid = () => String(idSeq++);

@Injectable()
export class DonationService {
  private charities = new Map<string, Charity>();
  private donations = new Map<string, Donation>();

  // --- Charities ---
  registerCharity(name: string, impactDescription: string): Charity {
    const id = uid();
    const charity: Charity = { id, name, verified: false, totalReceived: 0, impactDescription };
    this.charities.set(id, charity);
    return charity;
  }

  verifyCharity(id: string): Charity {
    const c = this.charities.get(id);
    if (!c) throw new NotFoundException('Charity not found');
    c.verified = true;
    return c;
  }

  listCharities(): Charity[] {
    return [...this.charities.values()];
  }

  // --- Donations ---
  donate(donorId: string, charityId: string, amount: number, currency = 'USD', recurring = false, intervalDays?: number): Donation {
    const charity = this.charities.get(charityId);
    if (!charity) throw new NotFoundException('Charity not found');
    if (!charity.verified) throw new NotFoundException('Charity not verified');

    const id = uid();
    const now = Date.now();
    const donation: Donation = {
      id, donorId, charityId, amount, currency, recurring,
      intervalDays,
      nextDueAt: recurring && intervalDays ? now + intervalDays * 86400_000 : undefined,
      taxReceiptGenerated: false,
      createdAt: now,
    };
    this.donations.set(id, donation);
    charity.totalReceived += amount;
    return donation;
  }

  generateTaxReceipt(donationId: string): { receipt: string; donation: Donation } {
    const d = this.donations.get(donationId);
    if (!d) throw new NotFoundException('Donation not found');
    d.taxReceiptGenerated = true;
    const receipt = `TAX-RECEIPT-${donationId}-${d.amount}${d.currency}-${new Date(d.createdAt).toISOString()}`;
    return { receipt, donation: d };
  }

  getDonorHistory(donorId: string): Donation[] {
    return [...this.donations.values()].filter(d => d.donorId === donorId);
  }

  getImpactReport(charityId: string): ImpactReport {
    const all = [...this.donations.values()].filter(d => d.charityId === charityId);
    const donors = new Set(all.map(d => d.donorId)).size;
    const totalAmount = all.reduce((s, d) => s + d.amount, 0);
    return { charityId, totalDonations: all.length, totalAmount, donors };
  }

  // Quadratic funding: match = sqrt(sum of sqrt(amounts))^2
  quadraticMatch(charityId: string): { matched: number } {
    const all = [...this.donations.values()].filter(d => d.charityId === charityId);
    const sumSqrt = all.reduce((s, d) => s + Math.sqrt(d.amount), 0);
    return { matched: Math.round(sumSqrt * sumSqrt * 100) / 100 };
  }
}
