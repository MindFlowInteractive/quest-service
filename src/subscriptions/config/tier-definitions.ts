import { SubscriptionTier, BillingInterval } from '../enums/subscription.enums';

export interface TierFeatures {
  maxPuzzlesPerDay: number;
  maxHintsPerPuzzle: number;
  analyticsAccess: boolean;
  customPuzzleBuilder: boolean;
  prioritySupport: boolean;
  offlineMode: boolean;
  teamCollaboration: boolean;
  apiAccess: boolean;
  advancedAnalytics: boolean;
  whiteLabel: boolean;
  ssoIntegration: boolean;
  dedicatedAccount: boolean;
}

export interface TierPricing {
  [BillingInterval.MONTHLY]: number; // price in USD cents
  [BillingInterval.YEARLY]: number;
}

export interface TierDefinition {
  tier: SubscriptionTier;
  name: string;
  description: string;
  pricing: TierPricing;
  features: TierFeatures;
  trialDays: number;
}

export const TIER_DEFINITIONS: Record<SubscriptionTier, TierDefinition> = {
  [SubscriptionTier.FREE]: {
    tier: SubscriptionTier.FREE,
    name: 'Free',
    description: 'Get started with core puzzle features at no cost.',
    pricing: {
      [BillingInterval.MONTHLY]: 0,
      [BillingInterval.YEARLY]: 0,
    },
    features: {
      maxPuzzlesPerDay: 5,
      maxHintsPerPuzzle: 1,
      analyticsAccess: false,
      customPuzzleBuilder: false,
      prioritySupport: false,
      offlineMode: false,
      teamCollaboration: false,
      apiAccess: false,
      advancedAnalytics: false,
      whiteLabel: false,
      ssoIntegration: false,
      dedicatedAccount: false,
    },
    trialDays: 0,
  },

  [SubscriptionTier.BASIC]: {
    tier: SubscriptionTier.BASIC,
    name: 'Basic',
    description: 'Unlock more puzzles and hints for avid solvers.',
    pricing: {
      [BillingInterval.MONTHLY]: 999, // $9.99
      [BillingInterval.YEARLY]: 8999, // $89.99 (~25% saving)
    },
    features: {
      maxPuzzlesPerDay: 50,
      maxHintsPerPuzzle: 5,
      analyticsAccess: true,
      customPuzzleBuilder: false,
      prioritySupport: false,
      offlineMode: true,
      teamCollaboration: false,
      apiAccess: false,
      advancedAnalytics: false,
      whiteLabel: false,
      ssoIntegration: false,
      dedicatedAccount: false,
    },
    trialDays: 7,
  },

  [SubscriptionTier.PRO]: {
    tier: SubscriptionTier.PRO,
    name: 'Pro',
    description: 'Full feature access for power users and creators.',
    pricing: {
      [BillingInterval.MONTHLY]: 2999, // $29.99
      [BillingInterval.YEARLY]: 26999, // $269.99 (~25% saving)
    },
    features: {
      maxPuzzlesPerDay: -1, // unlimited
      maxHintsPerPuzzle: -1,
      analyticsAccess: true,
      customPuzzleBuilder: true,
      prioritySupport: true,
      offlineMode: true,
      teamCollaboration: true,
      apiAccess: true,
      advancedAnalytics: true,
      whiteLabel: false,
      ssoIntegration: false,
      dedicatedAccount: false,
    },
    trialDays: 14,
  },

  [SubscriptionTier.ENTERPRISE]: {
    tier: SubscriptionTier.ENTERPRISE,
    name: 'Enterprise',
    description: 'Custom pricing and full control for large organisations.',
    pricing: {
      [BillingInterval.MONTHLY]: 0, // negotiated
      [BillingInterval.YEARLY]: 0,
    },
    features: {
      maxPuzzlesPerDay: -1,
      maxHintsPerPuzzle: -1,
      analyticsAccess: true,
      customPuzzleBuilder: true,
      prioritySupport: true,
      offlineMode: true,
      teamCollaboration: true,
      apiAccess: true,
      advancedAnalytics: true,
      whiteLabel: true,
      ssoIntegration: true,
      dedicatedAccount: true,
    },
    trialDays: 30,
  },
};
