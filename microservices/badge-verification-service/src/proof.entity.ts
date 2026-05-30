export interface Proof {
  id: string;
  badgeId: string;
  owner: string;
  merkleRoot: string;
  merkleProof: string[];
  issuedAt: number;
  expiresAt?: number;
  revoked?: boolean;
  txHash?: string;
}
