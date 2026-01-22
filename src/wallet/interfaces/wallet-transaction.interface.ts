import type { StellarAsset } from '../utils/stellar';

export type WalletTransactionType = 'purchase' | 'spend';
export type WalletTransactionStatus = 'confirmed' | 'failed';

export interface WalletTransaction {
  id: string;
  publicKey: string;
  network: string;
  type: WalletTransactionType;
  status: WalletTransactionStatus;
  asset: StellarAsset;
  amount: string;
  transactionHash: string;
  createdAt: Date;
}
