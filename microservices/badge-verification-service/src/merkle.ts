import { createHash } from 'crypto';

export function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

export function buildMerkleTree(leaves: string[]): string[] {
  if (leaves.length === 0) return [''];
  let level = leaves.map(sha256);
  const tree = [...level];
  while (level.length > 1) {
    const next: string[] = [];
    for (let i = 0; i < level.length; i += 2) {
      const left = level[i];
      const right = i + 1 < level.length ? level[i + 1] : left;
      next.push(sha256(left + right));
    }
    level = next;
    tree.push(...level);
  }
  return tree;
}

export function merkleProof(leaves: string[], index: number): string[] {
  if (index < 0 || index >= leaves.length) return [];
  let level = leaves.map(sha256);
  const proof: string[] = [];
  while (level.length > 1) {
    const pairIndex = index ^ 1;
    proof.push(level[pairIndex] ?? level[index]);
    const next: string[] = [];
    for (let i = 0; i < level.length; i += 2) {
      const left = level[i];
      const right = i + 1 < level.length ? level[i + 1] : left;
      next.push(sha256(left + right));
    }
    index = Math.floor(index / 2);
    level = next;
  }
  return proof;
}
