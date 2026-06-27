/**
 * Severity classification for vulnerability reports.
 * Drives reward tier selection and reputation delta.
 */
export enum SeverityTier {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  INFO = 'info',
}

/**
 * Workflow states for a vulnerability report.
 *
 *   NEW      ──► TRIAGED  ──► VERIFIED ──► FIXED
 *     │           │            │
 *     └─► REJECTED  └─► DUPLICATE  └─► DUPLICATE
 *
 * Only TRIAGED+VERIFIED yield reputation; only FIXED yields a reward.
 */
export enum ReportStatus {
  NEW = 'new',
  TRIAGED = 'triaged',
  VERIFIED = 'verified',
  FIXED = 'fixed',
  REJECTED = 'rejected',
  DUPLICATE = 'duplicate',
}

/**
 * Reward lifecycle used by the rewards service.
 */
export enum RewardStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  PAID = 'paid',
  DISPUTED = 'disputed',
  CANCELLED = 'cancelled',
}

/**
 * Bounty program lifecycle.
 */
export enum BountyStatus {
  DRAFT = 'draft',
  OPEN = 'open',
  PAUSED = 'paused',
  CLOSED = 'closed',
}

/**
 * Disclosure level the researcher requests.
 */
export enum DisclosureType {
  PUBLIC = 'public',
  PRIVATE = 'private',
  COORDINATED = 'coordinated',
}
