// Types for achievement conditions and user context

export type ConditionOperator = 'equals' | 'greater_than' | 'less_than' | 'in_range' | 'contains';
export type ConditionType =
  | 'puzzle_completion'
  | 'score_threshold'
  | 'time_limit'
  | 'streak'
  | 'accuracy'
  | 'category_mastery'
  | 'social'
  | 'custom';

export interface AchievementCondition {
  id: string;
  type: ConditionType;
  operator: ConditionOperator;
  value: any;
  description: string;
  metadata?: any;
}

export interface AchievementConditionGroup {
  type: 'single' | 'multiple' | 'sequence' | 'time_based';
  conditions: AchievementCondition[];
  logic?: 'AND' | 'OR';
  timeWindow?: {
    duration: number;
    type: 'rolling' | 'fixed';
  };
}

// User context for evaluation (extend as needed)
export interface UserContext {
  [key: string]: any;
}
