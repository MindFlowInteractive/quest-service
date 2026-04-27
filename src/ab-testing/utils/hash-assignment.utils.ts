import * as crypto from 'crypto';

/**
 * Deterministic hash-based assignment utilities.
 * Ensures same input always produces same output.
 */

/**
 * Assigns a user to a bucket (0-99) based on their ID and a seed.
 * @param userId - The user identifier
 * @param seed - Additional seed for different assignment contexts
 * @returns A number between 0 and 99
 */
export function assignToBucket(userId: string, seed: string = ''): number {
  const hash = crypto
    .createHash('md5')
    .update(`${userId}:${seed}`)
    .digest('hex');
  
  return parseInt(hash.substring(0, 8), 16) % 100;
}

/**
 * Determines if a user should be included based on percentage.
 * @param userId - The user identifier
 * @param seed - Additional seed for different assignment contexts
 * @param percentage - Percentage (0-100) of users to include
 * @returns True if user is included, false otherwise
 */
export function shouldIncludeUser(
  userId: string,
  seed: string,
  percentage: number,
): boolean {
  if (percentage >= 100) return true;
  if (percentage <= 0) return false;
  
  const bucket = assignToBucket(userId, seed);
  return bucket < percentage;
}

/**
 * Assigns a user to a variant based on traffic split percentage.
 * @param userId - The user identifier
 * @param seed - Additional seed for different assignment contexts
 * @param variants - Array of variant names
 * @param trafficSplitPct - Percentage (0-100) of traffic to include
 * @returns Variant name or null if user is outside traffic split
 */
export function assignToVariant(
  userId: string,
  seed: string,
  variants: string[],
  trafficSplitPct: number,
): string | null {
  if (trafficSplitPct <= 0) return null;
  
  const bucket = assignToBucket(userId, seed);
  
  // Check if user is outside traffic split
  if (bucket >= trafficSplitPct) return null;
  
  // Assign to variant based on bucket
  const variantIndex = bucket % variants.length;
  return variants[variantIndex];
}

/**
 * Creates a deterministic boolean for feature flag rollout.
 * Same user + flag key always returns same result.
 * @param userId - The user identifier
 * @param flagKey - The feature flag key
 * @param rolloutPct - Percentage (0-100) rollout
 * @returns True if flag is enabled for this user
 */
export function evaluateFeatureFlag(
  userId: string,
  flagKey: string,
  rolloutPct: number,
): boolean {
  if (rolloutPct >= 100) return true;
  if (rolloutPct <= 0) return false;
  
  const bucket = assignToBucket(userId, flagKey);
  return bucket < rolloutPct;
}