/**
 * Anti-Cheat System Constants and Enums
 */

/**
 * Types of cheat violations that can be detected
 */
export enum ViolationType {
  IMPOSSIBLY_FAST_COMPLETION = 'impossibly_fast_completion',
  ROBOTIC_TIMING = 'robotic_timing',
  PERFECT_ACCURACY = 'perfect_accuracy',
  AUTOMATED_SOLVER = 'automated_solver',
  SOLUTION_SHARING = 'solution_sharing',
  PATTERN_REUSE = 'pattern_reuse',
  MULTIPLE_ACCOUNTS = 'multiple_accounts',
  API_ABUSE = 'api_abuse',
  CLIENT_MANIPULATION = 'client_manipulation',
  IMPOSSIBLE_MOVE_SEQUENCE = 'impossible_move_sequence',
  ABNORMAL_BEHAVIOR = 'abnormal_behavior',
  SUSPICIOUS_STATISTICAL_PATTERN = 'suspicious_statistical_pattern'
}

/**
 * Severity levels for violations
 */
export enum Severity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Status of a violation record
 */
export enum ViolationStatus {
  PENDING = 'pending',
  UNDER_REVIEW = 'under_review',
  CONFIRMED = 'confirmed',
  FALSE_POSITIVE = 'false_positive',
  APPEALED = 'appealed',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed'
}

/**
 * Status of a cheat appeal
 */
export enum AppealStatus {
  PENDING = 'pending',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  DENIED = 'denied',
  WITHDRAWN = 'withdrawn'
}

/**
 * Types of fair play reports
 */
export enum ReportType {
  CHEATING = 'cheating',
  BOT_USAGE = 'bot_usage',
  SOLUTION_SHARING = 'solution_sharing',
  MULTIPLE_ACCOUNTS = 'multiple_accounts',
  SUSPICIOUS_BEHAVIOR = 'suspicious_behavior',
  OTHER = 'other'
}

/**
 * Status of a fair play report
 */
export enum ReportStatus {
  PENDING = 'pending',
  REVIEWING = 'reviewing',
  CONFIRMED = 'confirmed',
  DISMISSED = 'dismissed',
  DUPLICATE = 'duplicate'
}

/**
 * Action types that can be taken against players
 */
export enum ActionType {
  WARNING = 'warning',
  SCORE_RESET = 'score_reset',
  TEMP_BAN = 'temp_ban',
  PERMANENT_BAN = 'permanent_ban',
  ACCOUNT_RESTRICTION = 'account_restriction',
  MANUAL_REVIEW_REQUIRED = 'manual_review_required'
}

/**
 * Appeal outcome types
 */
export enum AppealOutcome {
  APPROVED = 'approved',
  DENIED = 'denied',
  PARTIAL = 'partial'
}

/**
 * Default configuration constants
 */
export const DEFAULT_CONFIG = {
  // Speed detection thresholds
  MINIMUM_MOVE_TIME: 100, // ms
  IMPOSSIBLY_FAST_THRESHOLD: 150, // ms
  MAX_FAST_MOVE_RATIO: 0.8,

  // Timing variance thresholds
  MIN_TIMING_VARIANCE: 50, // ms
  ROBOTIC_CONSISTENCY_THRESHOLD: 30, // ms

  // Accuracy thresholds
  SUSPICIOUS_ACCURACY_THRESHOLD: 0.95,
  PERFECT_ACCURACY_MIN_MOVES: 15,

  // Statistical analysis
  Z_SCORE_THRESHOLD: 3.0,
  POPULATION_SAMPLE_SIZE: 100,

  // Pattern detection
  PATTERN_SIMILARITY_THRESHOLD: 0.9,
  MIN_PATTERNS_FOR_COMPARISON: 3,

  // Rate limiting
  MAX_MOVES_PER_SECOND: 10,
  MAX_PUZZLES_PER_MINUTE: 5,

  // Trust scoring
  INITIAL_TRUST_SCORE: 100,
  MIN_TRUST_SCORE: 0,
  TRUST_RECOVERY_RATE: 1.0, // per day

  // Shadow mode
  SHADOW_MODE: true,
  SHADOW_MODE_DURATION_DAYS: 30,

  // Appeals
  MAX_APPEALS_PER_VIOLATION: 1,
  APPEAL_REVIEW_SLA_HOURS: 72
} as const;

/**
 * Trust score decay per violation severity
 */
export const TRUST_DECAY = {
  [Severity.LOW]: 5,
  [Severity.MEDIUM]: 10,
  [Severity.HIGH]: 25,
  [Severity.CRITICAL]: 50
} as const;

/**
 * Action tiers based on violation count
 */
export const ACTION_TIERS = {
  TIER_1: { violations: 1, action: ActionType.WARNING },
  TIER_2: { violations: 2, action: ActionType.TEMP_BAN, duration: 24 },
  TIER_3: { violations: 3, action: ActionType.TEMP_BAN, duration: 168 }, // 7 days
  TIER_4: { violations: 5, action: ActionType.PERMANENT_BAN }
} as const;
