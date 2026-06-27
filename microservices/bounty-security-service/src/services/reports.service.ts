import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VulnerabilityReport } from '../entities/report.entity';
import { ReportStatus, SeverityTier } from '../entities/report-status.enum';
import {
  SubmitReportDto,
  TransitionReportDto,
  ListReportsFilterDto,
} from '../dto/report.dto';
import { ResearchersService } from './researchers.service';
import { BountiesService } from './bounties.service';
import { SeverityService } from './severity.service';
import { RewardsService } from './rewards.service';

/**
 * Allowed workflow transitions. Anything not listed is rejected by the
 * service to avoid status corruption.
 *
 *   NEW      ──► TRIAGED, REJECTED
 *   TRIAGED  ──► VERIFIED, REJECTED, DUPLICATE
 *   VERIFIED ──► FIXED, REJECTED, DUPLICATE
 *   FIXED    ──► TRIAGED (re-open)
 */
const TRANSITIONS: Record<ReportStatus, ReportStatus[]> = {
  [ReportStatus.NEW]: [ReportStatus.TRIAGED, ReportStatus.REJECTED],
  [ReportStatus.TRIAGED]: [
    ReportStatus.VERIFIED,
    ReportStatus.REJECTED,
    ReportStatus.DUPLICATE,
  ],
  [ReportStatus.VERIFIED]: [
    ReportStatus.FIXED,
    ReportStatus.REJECTED,
    ReportStatus.DUPLICATE,
  ],
  [ReportStatus.FIXED]: [ReportStatus.TRIAGED], // re-open after regression
  [ReportStatus.REJECTED]: [],
  [ReportStatus.DUPLICATE]: [],
};

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    @InjectRepository(VulnerabilityReport)
    private readonly repo: Repository<VulnerabilityReport>,
    private readonly researchersService: ResearchersService,
    private readonly bountiesService: BountiesService,
    private readonly severityService: SeverityService,
    private readonly rewardsService: RewardsService,
  ) {}

  // ── Submission ──────────────────────────────────────────────────────────

  /**
   * Submit a new vulnerability report. Resolves the researcher and bounty,
   * runs a quick severity preview, and increments the researcher's submission
   * counter.
   */
  async submit(dto: SubmitReportDto): Promise<VulnerabilityReport> {
    const researcher = await this.researchersService.findById(dto.researcherId);
    if (researcher.isBlocked) {
      throw new BadRequestException(`Researcher ${researcher.handle} is blocked from submitting`);
    }

    let bountyId: string | null = null;
    if (dto.bountySlug) {
      const bounty = await this.bountiesService.findBySlug(dto.bountySlug);
      if (!bounty) {
        throw new BadRequestException(`Bounty with slug "${dto.bountySlug}" not found`);
      }
      if (bounty.status !== 'open') {
        throw new BadRequestException(
          `Bounty "${bounty.slug}" is not currently accepting reports (status=${bounty.status})`,
        );
      }
      bountyId = bounty.id;
    }

    const preview = this.severityService.assess({
      researcherSeverity: dto.severity,
      cvssScore: dto.cvssScore ?? null,
      cvssVector: dto.cvssVector ?? null,
      affectedComponent: dto.affectedComponent,
    });

    const created = this.repo.create({
      title: dto.title,
      description: dto.description,
      stepsToReproduce: dto.stepsToReproduce,
      affectedComponent: dto.affectedComponent,
      severity: dto.severity,
      cvssScore: dto.cvssScore ?? null,
      cvssVector: dto.cvssVector ?? null,
      disclosure: dto.disclosure,
      status: ReportStatus.NEW,
      researcherId: dto.researcherId,
      bountyId,
      attachments: dto.attachments ?? [],
      transitions: [],
      // The preview is purely informational; assessedSeverity is set at triage time.
      assessedSeverity: null,
      severityRationale: { preview },
    });

    const saved = await this.repo.save(created);
    await this.researchersService.incrementReportCounts(
      dto.researcherId,
      'submitted',
      dto.severity,
      bountyId,
      null,
    );
    this.logger.log(
      `Report ${saved.id} submitted by ${researcher.handle} severity=${dto.severity}`,
    );
    return saved;
  }

  // ── Reads ───────────────────────────────────────────────────────────────

  async getById(id: string): Promise<VulnerabilityReport> {
    const r = await this.repo.findOne({ where: { id } });
    if (!r) throw new NotFoundException(`Report ${id} not found`);
    return r;
  }

  async list(filter: ListReportsFilterDto) {
    const safePage = Math.max(1, filter.page ?? 1);
    const safeLimit = Math.max(1, Math.min(100, filter.limit ?? 20));
    const where: Record<string, any> = {};
    if (filter.status) where.status = filter.status;
    if (filter.severity) where.severity = filter.severity;
    if (filter.researcherId) where.researcherId = filter.researcherId;
    if (filter.bountyId) where.bountyId = filter.bountyId;

    const [data, total] = await this.repo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
    });
    return { data, total, page: safePage, limit: safeLimit };
  }

  // ── Workflow ────────────────────────────────────────────────────────────

  /**
   * Apply a workflow transition to a report. This is the single entry point
   * for status changes and enforces the state machine.
   *
   * Idempotency:
   *   - Reputation/penalty credit runs at most once per report, gated by
   *     `report.reputationCreditedAt`. This protects against double-counting
   *     on the New→Verified→Fixed walk and the Fix→Triaged reopen path.
   *   - Reward creation in `RewardsService.createFromFix` is itself
   *     idempotent on (reportId).
   */
  async transition(id: string, dto: TransitionReportDto): Promise<VulnerabilityReport> {
    const report = await this.getById(id);
    const fromStatus = report.status;
    const allowed = TRANSITIONS[fromStatus];

    if (!allowed.includes(dto.toStatus)) {
      throw new BadRequestException(
        `Invalid transition: ${fromStatus} → ${dto.toStatus}. Allowed: ${allowed.join(', ') || '(none)'}`,
      );
    }

    if (dto.severityOverride && dto.toStatus !== ReportStatus.TRIAGED) {
      throw new BadRequestException(
        `severityOverride is only valid when transitioning to TRIAGED (got ${dto.toStatus})`,
      );
    }

    report.status = dto.toStatus;
    report.transitions = [
      ...(report.transitions ?? []),
      {
        from: fromStatus,
        to: dto.toStatus,
        by: dto.actor,
        note: dto.note,
        at: new Date(),
      },
    ];

    // Update side-effects per transition.
    const effectiveSeverity = (dto.severityOverride ?? report.assessedSeverity ?? report.severity) as SeverityTier;

    switch (dto.toStatus) {
      case ReportStatus.TRIAGED: {
        const assessment = this.severityService.assess({
          researcherSeverity: report.severity,
          cvssScore: report.cvssScore,
          cvssVector: report.cvssVector,
          affectedComponent: report.affectedComponent,
        });
        report.assessedSeverity = dto.severityOverride ?? assessment.severity;
        report.severityRationale = {
          ...(report.severityRationale ?? {}),
          triage: assessment,
        };
        report.triagedBy = dto.actor;
        report.triagedAt = new Date();
        break;
      }
      case ReportStatus.VERIFIED:
        report.verifiedAt = new Date();
        break;
      case ReportStatus.FIXED: {
        report.fixedAt = new Date();
        // Auto-create a reward row when a report is closed.
        if (report.researcherId && report.bountyId) {
          const bounty = await this.bountiesService.findById(report.bountyId);
          const tier = this.bountiesService.resolveRewardAmount(bounty, effectiveSeverity);
          await this.rewardsService.createFromFix(
            report.id,
            report.researcherId,
            report.bountyId,
            tier.suggested,
            tier.currency,
          );
        }
        break;
      }
      default:
        break;
    }

    // Apply reputation once per report. FIXED = accept; REJECTED/DUPLICATE = penalise.
    const shouldCreditAccept =
      dto.toStatus === ReportStatus.FIXED && !report.reputationCreditedAt;
    const shouldApplyPenalty =
      (dto.toStatus === ReportStatus.REJECTED || dto.toStatus === ReportStatus.DUPLICATE) &&
      !report.reputationCreditedAt;

    if (shouldCreditAccept || shouldApplyPenalty) {
      await this.researchersService.incrementReportCounts(
        report.researcherId,
        dto.toStatus,
        effectiveSeverity,
        report.bountyId,
        null,
      );
      report.reputationCreditedAt = new Date();
    }

    const saved = await this.repo.save(report);
    this.logger.log(
      `Report ${id} ${fromStatus} → ${dto.toStatus} by ${dto.actor}`,
    );
    return saved;
  }
}
