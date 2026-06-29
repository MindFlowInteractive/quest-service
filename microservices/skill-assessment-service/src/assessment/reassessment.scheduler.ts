import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Assessment, AssessmentStatus, AssessmentType } from './entities/assessment.entity';

@Injectable()
export class ReassessmentScheduler {
  private readonly logger = new Logger(ReassessmentScheduler.name);

  constructor(
    @InjectRepository(Assessment)
    private assessmentRepository: Repository<Assessment>,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleReassessments() {
    this.logger.log('Checking for players due for reassessment...');

    const now = new Date();
    const dueAssessments = await this.assessmentRepository.find({
      where: {
        status: AssessmentStatus.COMPLETED,
        nextReassessmentAt: { $lte: now } as any,
      },
    });

    this.logger.log(`Found ${dueAssessments.length} players due for reassessment`);

    for (const assessment of dueAssessments) {
      await this.createReassessment(assessment.playerId);
    }
  }

  private async createReassessment(playerId: string): Promise<void> {
    const newAssessment = this.assessmentRepository.create({
      playerId,
      type: AssessmentType.REASSESSMENT,
      status: AssessmentStatus.PENDING,
      difficultyLevel: parseInt(process.env.INITIAL_DIFFICULTY || '1', 10),
    });

    await this.assessmentRepository.save(newAssessment);
    this.logger.log(`Created reassessment for player ${playerId}`);
  }
}
