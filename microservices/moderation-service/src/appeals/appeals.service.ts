import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appeal, AppealStatus } from '../entities/appeal.entity';
import { ActionsService } from '../actions/actions.service';
import { NotificationService } from '../notifications/notification.service';

export class CreateAppealDto {
    userId: string;
    violationId: string;
    reason: string;
}

export class ResolveAppealDto {
    reviewerId: string;
    decision: 'ACCEPTED' | 'REJECTED';
    comments?: string;
}

@Injectable()
export class AppealsService {
    private readonly logger = new Logger(AppealsService.name);

    constructor(
        @InjectRepository(Appeal)
        private appealsRepository: Repository<Appeal>,
        private readonly actionsService: ActionsService,
        private readonly notificationService: NotificationService,
    ) { }

    async createAppeal(dto: CreateAppealDto): Promise<Appeal> {
        // Verify the violation exists
        const violation = await this.actionsService.getViolationById(dto.violationId);
        if (!violation) {
            throw new NotFoundException(`Violation ${dto.violationId} not found`);
        }

        // Check if user already has a pending appeal for this violation
        const existingAppeal = await this.appealsRepository.findOne({
            where: {
                userId: dto.userId,
                violationId: dto.violationId,
                status: AppealStatus.PENDING,
            },
        });

        if (existingAppeal) {
            throw new BadRequestException('An appeal for this violation is already pending');
        }

        const appeal = this.appealsRepository.create({
            userId: dto.userId,
            violationId: dto.violationId,
            reason: dto.reason,
            status: AppealStatus.PENDING,
        });

        const savedAppeal = await this.appealsRepository.save(appeal);

        // Notify user that appeal was received
        await this.notificationService.notifyAppealReceived(dto.userId, savedAppeal.id);

        this.logger.log(`Appeal ${savedAppeal.id} created for violation ${dto.violationId}`);
        return savedAppeal;
    }

    async findAll(): Promise<Appeal[]> {
        return this.appealsRepository.find({ order: { createdAt: 'DESC' } });
    }

    async findPending(): Promise<Appeal[]> {
        return this.appealsRepository.find({
            where: { status: AppealStatus.PENDING },
            order: { createdAt: 'ASC' },
        });
    }

    async findOne(id: string): Promise<Appeal> {
        const appeal = await this.appealsRepository.findOne({ where: { id } });
        if (!appeal) {
            throw new NotFoundException(`Appeal ${id} not found`);
        }
        return appeal;
    }

    async assignToReviewer(appealId: string, reviewerId: string): Promise<Appeal> {
        const appeal = await this.findOne(appealId);

        if (appeal.status !== AppealStatus.PENDING) {
            throw new BadRequestException('Appeal is not in pending status');
        }

        appeal.status = AppealStatus.UNDER_REVIEW;
        appeal.reviewerId = reviewerId;

        this.logger.log(`Appeal ${appealId} assigned to reviewer ${reviewerId}`);
        return this.appealsRepository.save(appeal);
    }

    async resolveAppeal(appealId: string, dto: ResolveAppealDto): Promise<Appeal> {
        const appeal = await this.findOne(appealId);

        if (appeal.status === AppealStatus.ACCEPTED || appeal.status === AppealStatus.REJECTED) {
            throw new BadRequestException('Appeal has already been resolved');
        }

        appeal.status = dto.decision === 'ACCEPTED' ? AppealStatus.ACCEPTED : AppealStatus.REJECTED;
        appeal.reviewerId = dto.reviewerId;
        appeal.reviewComments = dto.comments!;
        appeal.resolvedAt = new Date();

        const savedAppeal = await this.appealsRepository.save(appeal);

        // Notify user of the outcome
        await this.notificationService.notifyAppealResolved(
            appeal.userId,
            dto.decision,
            dto.comments,
        );

        this.logger.log(`Appeal ${appealId} resolved as ${dto.decision} by ${dto.reviewerId}`);
        return savedAppeal;
    }

    async getAppealsByUser(userId: string): Promise<Appeal[]> {
        return this.appealsRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
        });
    }

    async getAppealStats(): Promise<{
        pending: number;
        underReview: number;
        accepted: number;
        rejected: number;
        total: number;
    }> {
        const [pending, underReview, accepted, rejected, total] = await Promise.all([
            this.appealsRepository.count({ where: { status: AppealStatus.PENDING } }),
            this.appealsRepository.count({ where: { status: AppealStatus.UNDER_REVIEW } }),
            this.appealsRepository.count({ where: { status: AppealStatus.ACCEPTED } }),
            this.appealsRepository.count({ where: { status: AppealStatus.REJECTED } }),
            this.appealsRepository.count(),
        ]);

        return { pending, underReview, accepted, rejected, total };
    }
}
