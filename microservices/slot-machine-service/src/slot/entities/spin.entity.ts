export interface SpinResult {
  userId: string;
  nonce: number;
  reels: string[][];
  payline: string[];
  payout: number;
  multiplier: number;
  timestamp: number;
  serverSeedHash: string;
  serverSeed?: string;
  clientSeed: string;
  proof: string; // HMAC or signature
}
