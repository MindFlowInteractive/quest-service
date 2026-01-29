import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Violation, ActionTaken, ViolationSeverity } from '../entities/violation.entity';
import { NotificationService } from '../notifications/notification.service';

@Injectable()
export class ActionsService {
    private readonly logger = new Logger(ActionsService.name);

    constructor(
        @InjectRepository(Violation)
        private violationsRepository: Repository<Violation>,
        private readonly notificationService: NotificationService,
    ) { }

    async warnUser(userId: string, reason: string): Promise<Violation> {
        this.logger.log(`Warning user ${userId} for ${reason}`);

        const violation = this.violationsRepository.create({
            userId,
            type: 'WARNING',
            severity: ViolationSeverity.LOW,
            description: reason,
            actionTaken: ActionTaken.WARN,
        });
        const savedViolation = await this.violationsRepository.save(violation);

        // Send notification
        await this.notificationService.notifyUserWarning(userId, reason);

        return savedViolation;
    }

    async suspendUser(userId: string, reason: string, duration?: string): Promise<Violation> {
        this.logger.log(`Suspending user ${userId} for ${reason}`);

        const violation = this.violationsRepository.create({
            userId,
            type: 'SUSPENSION',
            severity: ViolationSeverity.HIGH,
            description: reason,
            actionTaken: ActionTaken.SUSPEND,
        });
        const savedViolation = await this.violationsRepository.save(violation);

        // Send notification
        await this.notificationService.notifyUserSuspension(userId, reason, duration);

        return savedViolation;
    }

    async banUser(userId: string, reason: string): Promise<Violation> {
        this.logger.log(`Banning user ${userId} for ${reason}`);

        const violation = this.violationsRepository.create({
            userId,
            type: 'BAN',
            severity: ViolationSeverity.CRITICAL,
            description: reason,
            actionTaken: ActionTaken.BAN,
        });
        const savedViolation = await this.violationsRepository.save(violation);

        // Send notification
        await this.notificationService.notifyUserBan(userId, reason);

        return savedViolation;
    }

    async getUserViolations(userId: string): Promise<Violation[]> {
        return this.violationsRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
        });
    }

    async getViolationById(id: string): Promise<Violation | null> {
        return this.violationsRepository.findOne({ where: { id } });
    }
}
