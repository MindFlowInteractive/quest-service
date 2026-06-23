import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { Variant } from '../entities/variant.entity';

@Injectable()
export class AssignmentService {
  // Assign a user to a variant based on consistent hashing and variant weights
  assign(userId: string, variants: Variant[]): Variant {
    if (!variants || variants.length === 0) {
      throw new Error('No variants available for assignment');
    }
    // Compute a 32‑bit hash of the userId
    const hash = crypto.createHash('sha256').update(userId).digest('hex');
    const intHash = parseInt(hash.slice(0, 8), 16);
    // Build cumulative weight array
    const totalWeight = variants.reduce((sum, v) => sum + (v.weight || 1), 0);
    const threshold = intHash % totalWeight;
    let accumulator = 0;
    for (const variant of variants) {
      accumulator += variant.weight || 1;
      if (threshold < accumulator) {
        return variant;
      }
    }
    // Fallback – return first variant
    return variants[0];
  }
}
