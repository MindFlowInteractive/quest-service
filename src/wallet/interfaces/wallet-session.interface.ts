export interface WalletSession {
  sessionToken: string;
  publicKey: string;
  network: string;
  createdAt: Date;
  expiresAt: Date;
  lastUsedAt: Date;
}
