import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Proof } from './proof.entity';
import { buildMerkleTree, merkleProof, sha256 } from './merkle';

@Injectable()
export class VerificationService {
  private store = new Map<string, Proof>();

  generateProof(badgeId: string, owner: string, ttlSeconds?: number): Proof {
    const id = uuidv4();
    const issuedAt = Date.now();
    const expiresAt = ttlSeconds ? issuedAt + ttlSeconds * 1000 : undefined;
    // simple leaf set — badgeId + owner
    const leaves = [badgeId + '|' + owner + '|' + issuedAt.toString()];
    const tree = buildMerkleTree(leaves);
    const root = tree[tree.length - 1];
    const proof = merkleProof(leaves, 0);
    const p: Proof = { id, badgeId, owner, merkleRoot: root, merkleProof: proof, issuedAt, expiresAt };
    this.store.set(id, p);
    return p;
  }

  getProof(id: string): Proof | undefined {
    return this.store.get(id);
  }

  revokeProof(id: string): boolean {
    const p = this.store.get(id);
    if (!p) return false;
    p.revoked = true;
    this.store.set(id, p);
    return true;
  }

  commitOnChain(id: string): string | undefined {
    const p = this.store.get(id);
    if (!p) return undefined;
    // simulate tx hash
    const txHash = sha256(id + '|' + Date.now().toString());
    p.txHash = txHash;
    this.store.set(id, p);
    return txHash;
  }

  verifyProof(id: string): { ok: boolean; reason?: string } {
    const p = this.store.get(id);
    if (!p) return { ok: false, reason: 'not_found' };
    if (p.revoked) return { ok: false, reason: 'revoked' };
    if (p.expiresAt && Date.now() > p.expiresAt) return { ok: false, reason: 'expired' };
    // if it has txHash, it's considered on-chain verified
    if (!p.txHash) return { ok: false, reason: 'not_on_chain' };
    return { ok: true };
  }
}
