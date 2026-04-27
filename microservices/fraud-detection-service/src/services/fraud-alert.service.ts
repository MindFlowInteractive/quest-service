import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  FraudAlert,
  AlertSeverity,
  AlertStatus,
  AlertType,
} from '../entities/fraud-alert.entity';
import {
  ReviewQueue,
  ReviewPriority,
  ReviewStatus,
} from '../entities/review-queue.entity';
import { UpdateAlertDto, AssignReviewDto, CompleteReviewDto } from '../dto/fraud.dto';
import { RiskScore } from './anomaly-detection.service';

export const FRAUD_EVENTS = {
  ALERT_CREATED: 'fraud.alert.created',
  ALERT_ESCALATED: 'fraud.alert.escalated',
  REVIEW_ASSIGNED: 'fraud.review.assigned',
  REVIEW_COMPLETED: 'fraud.review.completed',
};

@Injectable()
export class FraudAlertService {
  private readonly logger = new Logger(FraudAlertService.name);

  constructor(
    @InjectRepository(FraudAlert)
    private readonly alertRepo: Repository<FraudAlert>,
    @InjectRepository(ReviewQueue)
    private readonly reviewRepo: Repository<ReviewQueue>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ── Alert management ──────────────────────────────────────────────────────

  async createAlert(
    playerId: string,
    type: AlertType,
    riskScore: number,
    description: string,
    evidence: Record<string, any> = {},
  ): Promise<FraudAlert> {
    const severity = this.scoretToSeverity(riskScore);

    const alert = this.alertRepo.create({
      playerId,
      type,
      severity,
      status: AlertStatus.OPEN,
      riskScore,
      description,
      evidence,
    });

    const saved = await this.alertRepo.save(alert);
    this.logger.warn(`Fraud alert created: ${saved.id} | player=${playerId} | type=${type} | score=${riskScore}`);

    // Emit real-time event
    this.eventEmitter.emit(FRAUD_EVENTS.ALERT_CREATED, { alert: saved });

    // Auto-escalate critical alerts to review queue
    if (severity === AlertSeverity.CRITICAL || severity === AlertSeverity.HIGH) {
      await this.addToReviewQueue(playerId, saved.id, description, evidence, severity);
    }

    return saved;
  }

  async getAlerts(filters: {
    playerId?: string;
    status?: AlertStatus;
    severity?: AlertSeverity;
    page?: number;
    limit?: number;
  }): Promise<{ alerts: FraudAlert[]; total: number }> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;

    const where: FindOptionsWhere<FraudAlert> = {};
    if (filters.playerId) where.playerId = filters.playerId;
    if (filters.status) where.status = filters.status;
    if (filters.severity) where.severity = filters.severity;

    const [alerts, total] = await this.alertRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { alerts, total };
  }

  async updateAlert(
    alertId: string,
    reviewerId: string,
    dto: UpdateAlertDto,
  ): Promise<FraudAlert> {
    const alert = await this.alertRepo.findOne({ where: { id: alertId } });
    if (!alert) throw new NotFoundException('Alert not found');

    if (dto.status) alert.status = dto.status;
    if (dto.reviewNote) alert.reviewNote = dto.reviewNote;
    alert.reviewedBy = reviewerId;
    alert.reviewedAt = new Date();

    return this.alertRepo.save(alert);
  }

  async getAlertStats(): Promise<{
    open: number;
    investigating: number;
    resolvedToday: number;
    criticalOpen: number;
    byType: Record<string, number>;
  }> {
    const open = await this.alertRepo.count({ where: { status: AlertStatus.OPEN } });
    const investigating = await this.alertRepo.count({ where: { status: AlertStatus.INVESTIGATING } });
    const criticalOpen = await this.alertRepo.count({ where: { status: AlertStatus.OPEN, severity: AlertSeverity.CRITICAL } });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const resolvedToday = await this.alertRepo
      .createQueryBuilder('a')
      .where('a.status = :s', { s: AlertStatus.RESOLVED })
      .andWhere('a.updatedAt >= :today', { today })
      .getCount();

    const byTypeRaw = await this.alertRepo
      .createQueryBuilder('a')
      .select('a.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('a.status = :s', { s: AlertStatus.OPEN })
      .groupBy('a.type')
      .getRawMany();

    const byType = byTypeRaw.reduce((acc, row) => {
      acc[row.type] = parseInt(row.count, 10);
      return acc;
    }, {} as Record<string, number>);

    return { open, investigating, resolvedToday, criticalOpen, byType };
  }

  // ── Manual review queue ───────────────────────────────────────────────────

  async addToReviewQueue(
    playerId: string,
    alertId: string | null,
    reason: string,
    evidence: Record<string, any>,
    severity: AlertSeverity,
  ): Promise<ReviewQueue> {
    const priority = this.severityToReviewPriority(severity);

    const item = this.reviewRepo.create({
      playerId,
      alertId,
      priority,
      status: ReviewStatus.PENDING,
      reason,
      evidence,
    });

    return this.reviewRepo.save(item);
  }

  async getReviewQueue(filters: {
    status?: ReviewStatus;
    priority?: ReviewPriority;
    assignedTo?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: ReviewQueue[]; total: number }> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;

    const where: FindOptionsWhere<ReviewQueue> = {};
    if (filters.status) where.status = filters.status;
    if (filters.priority) where.priority = filters.priority;
    if (filters.assignedTo) where.assignedTo = filters.assignedTo;

    const [items, total] = await this.reviewRepo.findAndCount({
      where,
      order: { priority: 'DESC', createdAt: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { items, total };
  }

  async assignReview(
    reviewId: string,
    dto: AssignReviewDto,
  ): Promise<ReviewQueue> {
    const item = await this.reviewRepo.findOne({ where: { id: reviewId } });
    if (!item) throw new NotFoundException('Review item not found');

    item.assignedTo = dto.reviewerId;
    item.assignedAt = new Date();
    item.status = ReviewStatus.IN_REVIEW;

    const updated = await this.reviewRepo.save(item);
    this.eventEmitter.emit(FRAUD_EVENTS.REVIEW_ASSIGNED, { review: updated });
    return updated;
  }

  async completeReview(
    reviewId: string,
    reviewerId: string,
    dto: CompleteReviewDto,
  ): Promise<ReviewQueue> {
    const item = await this.reviewRepo.findOne({ where: { id: reviewId } });
    if (!item) throw new NotFoundException('Review item not found');

    item.status = ReviewStatus.COMPLETED;
    item.outcome = dto.outcome;
    item.reviewerNotes = dto.notes;
    item.completedAt = new Date();

    const updated = await this.reviewRepo.save(item);
    this.eventEmitter.emit(FRAUD_EVENTS.REVIEW_COMPLETED, { review: updated });
    return updated;
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private scoretToSeverity(score: number): AlertSeverity {
    if (score >= 85) return AlertSeverity.CRITICAL;
    if (score >= 60) return AlertSeverity.HIGH;
    if (score >= 30) return AlertSeverity.MEDIUM;
    return AlertSeverity.LOW;
  }

  private severityToReviewPriority(severity: AlertSeverity): ReviewPriority {
    switch (severity) {
      case AlertSeverity.CRITICAL: return ReviewPriority.URGENT;
      case AlertSeverity.HIGH: return ReviewPriority.HIGH;
      case AlertSeverity.MEDIUM: return ReviewPriority.MEDIUM;
      default: return ReviewPriority.LOW;
    }
  }

  /** Create alerts from a risk score result */
  async processRiskScore(risk: RiskScore): Promise<void> {
    if (risk.score < 30) return;

    const alertType =
      risk.score >= 85 ? AlertType.ANOMALY :
      risk.score >= 60 ? AlertType.BOT_BEHAVIOR :
      AlertType.VELOCITY;

    await this.createAlert(
      risk.playerId,
      alertType,
      risk.score,
      `Automated risk assessment: score=${risk.score} level=${risk.level}`,
      {
        anomalyCount: risk.anomalies.length,
        anomalyTypes: [...new Set(risk.anomalies.map((a) => a.anomalyType))],
      },
    );
  }
}
