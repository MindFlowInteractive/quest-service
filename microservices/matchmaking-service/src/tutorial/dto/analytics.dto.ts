import {
  IsString,
  IsEnum,
  IsBoolean,
  IsOptional,
  IsUUID,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';

export class DateRangeDto {
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  startDate?: Date;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  endDate?: Date;
}

export class TutorialAnalyticsFilterDto {
  @IsUUID()
  @IsOptional()
  tutorialId?: string;

  @IsUUID()
  @IsOptional()
  stepId?: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  startDate?: Date;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  endDate?: Date;

  @IsString()
  @IsOptional()
  eventType?: string;

  @IsEnum(['day', 'week', 'month'])
  @IsOptional()
  groupBy?: string;
}

export class TutorialEffectivenessFilterDto {
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  startDate?: Date;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  endDate?: Date;

  @IsBoolean()
  @IsOptional()
  includeStepBreakdown?: boolean;

  @IsBoolean()
  @IsOptional()
  includeDropOffAnalysis?: boolean;
}

export class AnalyticsExportFilterDto {
  @IsUUID()
  @IsOptional()
  tutorialId?: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  startDate?: Date;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  endDate?: Date;

  @IsEnum(['csv', 'json'])
  @IsOptional()
  format?: 'csv' | 'json';

  @IsBoolean()
  @IsOptional()
  includeUserDetails?: boolean;
}

// Response Types
export interface CompletionRateReport {
  tutorialId: string;
  tutorialName: string;
  totalStarted: number;
  totalCompleted: number;
  completionRate: number;
  averageCompletionTime: number;
}

export interface DropOffAnalysis {
  tutorialId: string;
  tutorialName: string;
  totalStarted: number;
  dropOffPoints: Array<{
    stepId: string;
    stepTitle: string;
    stepOrder: number;
    usersReached: number;
    usersDropped: number;
    dropOffRate: number;
    averageTimeBeforeDropOff: number;
  }>;
  overallDropOffRate: number;
}

export interface StepEffectiveness {
  stepId: string;
  stepTitle: string;
  completionRate: number;
  averageAttempts: number;
  averageTimeSpent: number;
  hintUsageRate: number;
  commonErrors: Array<{ error: string; count: number }>;
  skipRate: number;
}

export interface EffectivenessReport {
  tutorialId: string;
  tutorialName: string;
  period: { startDate: Date; endDate: Date };
  metrics: {
    completionRate: number;
    averageScore: number;
    averageCompletionTime: number;
    totalUsers: number;
    activeUsers: number;
  };
  stepBreakdown?: StepEffectiveness[];
  dropOffAnalysis?: DropOffAnalysis;
  trends: Array<{
    date: string;
    completions: number;
    averageScore: number;
  }>;
}

export interface LearningProfile {
  userId: string;
  totalTutorialsStarted: number;
  totalTutorialsCompleted: number;
  overallCompletionRate: number;
  averageLearningSpeed: 'slow' | 'normal' | 'fast';
  strongAreas: string[];
  improvementAreas: string[];
  preferredContentTypes: string[];
  totalTimeSpent: number;
  recentActivity: Array<{
    tutorialId: string;
    tutorialName: string;
    status: string;
    lastActivityAt: Date;
  }>;
}

export interface TutorialDashboardReport {
  period: { startDate: Date; endDate: Date };
  overview: {
    totalTutorials: number;
    activeTutorials: number;
    totalUsersOnboarded: number;
    averageCompletionRate: number;
    activeUsersToday: number;
  };
  topTutorials: Array<{
    tutorialId: string;
    tutorialName: string;
    completionRate: number;
    totalCompletions: number;
  }>;
  needsAttention: Array<{
    tutorialId: string;
    tutorialName: string;
    issue: string;
    metric: number;
  }>;
  recentCompletions: Array<{
    userId: string;
    tutorialId: string;
    tutorialName: string;
    completedAt: Date;
    score: number;
  }>;
  trends: Array<{
    date: string;
    starts: number;
    completions: number;
    activeUsers: number;
  }>;
}
