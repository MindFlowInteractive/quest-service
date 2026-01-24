import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Tutorial } from '../entities/tutorial.entity';
import { TutorialStep } from '../entities/tutorial-step.entity';
import { UserTutorialProgress } from '../entities/user-tutorial-progress.entity';
import { TutorialAnalyticsEvent, TutorialEventType } from '../entities/tutorial-analytics-event.entity';
import {
  TutorialAnalyticsFilterDto,
  TutorialEffectivenessFilterDto,
  AnalyticsExportFilterDto,
  CompletionRateReport,
  DropOffAnalysis,
  StepEffectiveness,
  EffectivenessReport,
  LearningProfile,
  TutorialDashboardReport,
} from '../dto';

interface DateRange {
  startDate?: Date;
  endDate?: Date;
}

@Injectable()
export class TutorialAnalyticsService {
  private readonly logger = new Logger(TutorialAnalyticsService.name);

  constructor(
    @InjectRepository(TutorialAnalyticsEvent)
    private readonly eventRepo: Repository<TutorialAnalyticsEvent>,
    @InjectRepository(UserTutorialProgress)
    private readonly progressRepo: Repository<UserTutorialProgress>,
    @InjectRepository(Tutorial)
    private readonly tutorialRepo: Repository<Tutorial>,
    @InjectRepository(TutorialStep)
    private readonly stepRepo: Repository<TutorialStep>,
  ) {}

  // Event Tracking
  async trackEvent(event: {
    eventType: TutorialEventType;
    userId?: string;
    tutorialId?: string;
    stepId?: string;
    sessionId?: string;
    payload: any;
  }): Promise<void> {
    const analyticsEvent = this.eventRepo.create({
      eventType: event.eventType,
      userId: event.userId,
      tutorialId: event.tutorialId,
      stepId: event.stepId,
      sessionId: event.sessionId,
      payload: event.payload,
    });

    await this.eventRepo.save(analyticsEvent);
  }

  // Completion Rate Analytics
  async getTutorialCompletionRate(
    tutorialId: string,
    dateRange?: DateRange,
  ): Promise<number> {
    const whereClause: any = { tutorialId };

    if (dateRange?.startDate) {
      whereClause.createdAt = MoreThanOrEqual(dateRange.startDate);
    }

    const total = await this.progressRepo.count({ where: whereClause });
    const completed = await this.progressRepo.count({
      where: { ...whereClause, status: 'completed' },
    });

    return total > 0 ? (completed / total) * 100 : 0;
  }

  async getStepCompletionRates(tutorialId: string): Promise<StepEffectiveness[]> {
    const steps = await this.stepRepo.find({
      where: { tutorialId, isActive: true },
      order: { order: 'ASC' },
    });

    const progress = await this.progressRepo.find({
      where: { tutorialId },
    });

    return steps.map((step) => {
      const stepProgressData = progress.flatMap((p) =>
        p.stepProgress.filter((sp) => sp.stepId === step.id),
      );

      const completed = stepProgressData.filter((sp) => sp.status === 'completed').length;
      const total = stepProgressData.length || 1;
      const skipped = stepProgressData.filter((sp) => sp.status === 'skipped').length;

      const attempts = stepProgressData.map((sp) => sp.attempts);
      const times = stepProgressData.map((sp) => sp.timeSpent);
      const hints = stepProgressData.map((sp) => sp.hintsUsed);

      const errors: Record<string, number> = {};
      stepProgressData.forEach((sp) => {
        (sp.errors || []).forEach((error) => {
          errors[error] = (errors[error] || 0) + 1;
        });
      });

      return {
        stepId: step.id,
        stepTitle: step.title,
        completionRate: (completed / total) * 100,
        averageAttempts: attempts.length > 0 ? attempts.reduce((a, b) => a + b, 0) / attempts.length : 0,
        averageTimeSpent: times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0,
        hintUsageRate: hints.length > 0 ? hints.filter((h) => h > 0).length / hints.length : 0,
        commonErrors: Object.entries(errors)
          .map(([error, count]) => ({ error, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5),
        skipRate: (skipped / total) * 100,
      };
    });
  }

  async getOverallCompletionRate(dateRange?: DateRange): Promise<number> {
    const whereClause: any = {};

    if (dateRange?.startDate && dateRange?.endDate) {
      whereClause.createdAt = Between(dateRange.startDate, dateRange.endDate);
    }

    const total = await this.progressRepo.count({ where: whereClause });
    const completed = await this.progressRepo.count({
      where: { ...whereClause, status: 'completed' },
    });

    return total > 0 ? (completed / total) * 100 : 0;
  }

  // Drop-off Analysis
  async getDropOffAnalysis(tutorialId: string): Promise<DropOffAnalysis> {
    const tutorial = await this.tutorialRepo.findOne({ where: { id: tutorialId } });
    const steps = await this.stepRepo.find({
      where: { tutorialId, isActive: true },
      order: { order: 'ASC' },
    });

    const progress = await this.progressRepo.find({
      where: { tutorialId },
    });

    const totalStarted = progress.length;
    const dropOffPoints = steps.map((step) => {
      const usersReached = progress.filter((p) =>
        p.stepProgress.some((sp) => sp.stepId === step.id),
      ).length;

      const usersCompleted = progress.filter((p) =>
        p.stepProgress.some((sp) => sp.stepId === step.id && sp.status === 'completed'),
      ).length;

      const usersDropped = usersReached - usersCompleted;

      const timesBeforeDrop = progress
        .filter(
          (p) =>
            p.status !== 'completed' &&
            p.stepProgress.some(
              (sp) => sp.stepId === step.id && sp.status !== 'completed',
            ),
        )
        .map((p) => p.stepProgress.find((sp) => sp.stepId === step.id)?.timeSpent || 0);

      return {
        stepId: step.id,
        stepTitle: step.title,
        stepOrder: step.order,
        usersReached,
        usersDropped,
        dropOffRate: usersReached > 0 ? (usersDropped / usersReached) * 100 : 0,
        averageTimeBeforeDropOff:
          timesBeforeDrop.length > 0
            ? timesBeforeDrop.reduce((a, b) => a + b, 0) / timesBeforeDrop.length
            : 0,
      };
    });

    const totalCompleted = progress.filter((p) => p.status === 'completed').length;
    const overallDropOffRate = totalStarted > 0 ? ((totalStarted - totalCompleted) / totalStarted) * 100 : 0;

    return {
      tutorialId,
      tutorialName: tutorial?.name || '',
      totalStarted,
      dropOffPoints,
      overallDropOffRate,
    };
  }

  async getCommonDropOffPoints(): Promise<{ stepId: string; tutorialId: string; dropOffRate: number }[]> {
    const tutorials = await this.tutorialRepo.find({ where: { isActive: true } });
    const allDropOffs: { stepId: string; tutorialId: string; dropOffRate: number }[] = [];

    for (const tutorial of tutorials) {
      const analysis = await this.getDropOffAnalysis(tutorial.id);
      analysis.dropOffPoints.forEach((point) => {
        if (point.dropOffRate > 20) {
          allDropOffs.push({
            stepId: point.stepId,
            tutorialId: tutorial.id,
            dropOffRate: point.dropOffRate,
          });
        }
      });
    }

    return allDropOffs.sort((a, b) => b.dropOffRate - a.dropOffRate).slice(0, 10);
  }

  // Effectiveness Measurement
  async getTutorialEffectivenessReport(
    tutorialId: string,
    filters?: TutorialEffectivenessFilterDto,
  ): Promise<EffectivenessReport> {
    const tutorial = await this.tutorialRepo.findOne({ where: { id: tutorialId } });
    if (!tutorial) {
      throw new Error(`Tutorial not found: ${tutorialId}`);
    }

    const whereClause: any = { tutorialId };
    if (filters?.startDate && filters?.endDate) {
      whereClause.createdAt = Between(filters.startDate, filters.endDate);
    }

    const progress = await this.progressRepo.find({ where: whereClause });
    const completed = progress.filter((p) => p.status === 'completed');

    const scores = completed.filter((p) => p.overallScore).map((p) => Number(p.overallScore));
    const times = completed.filter((p) => p.totalTimeSpent > 0).map((p) => p.totalTimeSpent);

    const metrics = {
      completionRate: progress.length > 0 ? (completed.length / progress.length) * 100 : 0,
      averageScore: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
      averageCompletionTime: times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0,
      totalUsers: progress.length,
      activeUsers: progress.filter(
        (p) => p.lastActivityAt && new Date().getTime() - p.lastActivityAt.getTime() < 7 * 24 * 60 * 60 * 1000,
      ).length,
    };

    const report: EffectivenessReport = {
      tutorialId,
      tutorialName: tutorial.name,
      period: {
        startDate: filters?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: filters?.endDate || new Date(),
      },
      metrics,
      trends: [],
    };

    if (filters?.includeStepBreakdown) {
      report.stepBreakdown = await this.getStepCompletionRates(tutorialId);
    }

    if (filters?.includeDropOffAnalysis) {
      report.dropOffAnalysis = await this.getDropOffAnalysis(tutorialId);
    }

    return report;
  }

  // User Learning Analytics
  async getUserLearningProfile(userId: string): Promise<LearningProfile> {
    const progress = await this.progressRepo.find({
      where: { userId },
      relations: ['tutorial'],
    });

    const completed = progress.filter((p) => p.status === 'completed');
    const speeds = progress.map((p) => p.adaptiveState.learningSpeed);
    const speedCounts = { slow: 0, normal: 0, fast: 0 };
    speeds.forEach((s) => (speedCounts[s] = (speedCounts[s] || 0) + 1));
    const averageSpeed = Object.entries(speedCounts).sort((a, b) => b[1] - a[1])[0]?.[0] as
      | 'slow'
      | 'normal'
      | 'fast';

    const strongAreas = new Set<string>();
    const improvementAreas = new Set<string>();

    progress.forEach((p) => {
      (p.adaptiveState.strongAreas || []).forEach((area) => strongAreas.add(area));
      (p.adaptiveState.strugglingAreas || []).forEach((area) => improvementAreas.add(area));
    });

    const totalTimeSpent = progress.reduce((sum, p) => sum + p.totalTimeSpent, 0);

    return {
      userId,
      totalTutorialsStarted: progress.length,
      totalTutorialsCompleted: completed.length,
      overallCompletionRate: progress.length > 0 ? (completed.length / progress.length) * 100 : 0,
      averageLearningSpeed: averageSpeed || 'normal',
      strongAreas: Array.from(strongAreas),
      improvementAreas: Array.from(improvementAreas),
      preferredContentTypes: [],
      totalTimeSpent,
      recentActivity: progress
        .sort((a, b) => (b.lastActivityAt?.getTime() || 0) - (a.lastActivityAt?.getTime() || 0))
        .slice(0, 5)
        .map((p) => ({
          tutorialId: p.tutorialId,
          tutorialName: p.tutorial?.name || '',
          status: p.status,
          lastActivityAt: p.lastActivityAt || p.updatedAt,
        })),
    };
  }

  // Dashboard Report
  async generateDashboardReport(dateRange?: DateRange): Promise<TutorialDashboardReport> {
    const startDate = dateRange?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = dateRange?.endDate || new Date();

    const tutorials = await this.tutorialRepo.find({ where: { isActive: true } });
    const progress = await this.progressRepo.find({
      where: { createdAt: Between(startDate, endDate) },
      relations: ['tutorial'],
    });

    const completed = progress.filter((p) => p.status === 'completed');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeToday = progress.filter(
      (p) => p.lastActivityAt && p.lastActivityAt >= today,
    ).length;

    // Top tutorials by completion rate
    const tutorialStats = await Promise.all(
      tutorials.slice(0, 10).map(async (t) => {
        const rate = await this.getTutorialCompletionRate(t.id, dateRange);
        const completions = progress.filter(
          (p) => p.tutorialId === t.id && p.status === 'completed',
        ).length;
        return {
          tutorialId: t.id,
          tutorialName: t.name,
          completionRate: rate,
          totalCompletions: completions,
        };
      }),
    );

    // Needs attention (low completion rates)
    const needsAttention = tutorialStats
      .filter((t) => t.completionRate < 50 && t.totalCompletions > 0)
      .map((t) => ({
        tutorialId: t.tutorialId,
        tutorialName: t.tutorialName,
        issue: 'Low completion rate',
        metric: t.completionRate,
      }));

    return {
      period: { startDate, endDate },
      overview: {
        totalTutorials: tutorials.length,
        activeTutorials: tutorials.filter((t) => t.isActive).length,
        totalUsersOnboarded: completed.length,
        averageCompletionRate: await this.getOverallCompletionRate(dateRange),
        activeUsersToday: activeToday,
      },
      topTutorials: tutorialStats.sort((a, b) => b.completionRate - a.completionRate).slice(0, 5),
      needsAttention,
      recentCompletions: completed
        .sort((a, b) => (b.completedAt?.getTime() || 0) - (a.completedAt?.getTime() || 0))
        .slice(0, 10)
        .map((p) => ({
          userId: p.userId,
          tutorialId: p.tutorialId,
          tutorialName: p.tutorial?.name || '',
          completedAt: p.completedAt || p.updatedAt,
          score: Number(p.overallScore) || 0,
        })),
      trends: [],
    };
  }

  // Real-time Metrics
  async getActiveUsers(): Promise<number> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return this.progressRepo.count({
      where: {
        status: 'in_progress',
        lastActivityAt: MoreThanOrEqual(oneHourAgo),
      },
    });
  }

  async getCurrentCompletions(interval: 'hour' | 'day'): Promise<number> {
    const since =
      interval === 'hour'
        ? new Date(Date.now() - 60 * 60 * 1000)
        : new Date(Date.now() - 24 * 60 * 60 * 1000);

    return this.progressRepo.count({
      where: {
        status: 'completed',
        completedAt: MoreThanOrEqual(since),
      },
    });
  }
}
