export enum SegmentationType {
  RULE_BASED = 'rule_based',
  BEHAVIORAL = 'behavioral',
  DEMOGRAPHIC = 'demographic',
  COMPOSITE = 'composite',
}

export enum SegmentStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  ARCHIVED = 'archived',
}

export enum RuleOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'notEquals',
  IN = 'in',
  NOT_IN = 'notIn',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'notContains',
  GT = 'gt',
  GTE = 'gte',
  LT = 'lt',
  LTE = 'lte',
  BETWEEN = 'between',
  EXISTS = 'exists',
  NOT_EXISTS = 'notExists',
  REGEX = 'regex',
}

export enum RuleCombinator {
  AND = 'AND',
  OR = 'OR',
}

export enum RuleCategory {
  DEMOGRAPHIC = 'demographic',
  BEHAVIORAL = 'behavioral',
  CUSTOM = 'custom',
}

export enum MembershipSource {
  EVALUATION = 'evaluation',
  MANUAL = 'manual',
  IMPORT = 'import',
  REALTIME = 'realtime',
}

export enum SegmentEventType {
  ADDED = 'added',
  REMOVED = 'removed',
  REFRESHED = 'refreshed',
}

export enum ExperimentStatus {
  DRAFT = 'draft',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
}

/**
 * Shape of the behavioural / demographic data cached under
 * `segmentation:user:{userId}` in Redis. Each field is optional so consumers
 * only send what is available.
 */
export interface UserSignal {
  userId: string;
  // demographic
  country?: string;
  locale?: string;
  age?: number;
  gender?: string;
  platform?: string;
  // behavioural
  level?: number;
  xp?: number;
  totalSpend?: number;
  streak?: number;
  consecutiveDays?: number;
  lastEventAt?: string;
  eventCount?: number;
  lastAction?: string;
  // generic attributes can be added under `attributes`
  attributes?: Record<string, unknown>;
  updatedAt?: string;
}

export interface SizeSnapshot {
  segmentId: string;
  size: number;
  measuredAt: string;
}
