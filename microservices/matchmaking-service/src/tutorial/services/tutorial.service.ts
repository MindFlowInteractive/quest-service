import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Tutorial } from '../entities/tutorial.entity';
import { TutorialStep } from '../entities/tutorial-step.entity';
import { UserTutorialProgress } from '../entities/user-tutorial-progress.entity';
import {
  CreateTutorialDto,
  UpdateTutorialDto,
  TutorialFilterDto,
  CreateTutorialStepDto,
  UpdateTutorialStepDto,
  StepOrderDto,
} from '../dto';

@Injectable()
export class TutorialService {
  private readonly logger = new Logger(TutorialService.name);

  constructor(
    @InjectRepository(Tutorial)
    private readonly tutorialRepo: Repository<Tutorial>,
    @InjectRepository(TutorialStep)
    private readonly stepRepo: Repository<TutorialStep>,
    @InjectRepository(UserTutorialProgress)
    private readonly progressRepo: Repository<UserTutorialProgress>,
  ) {}

  // Tutorial CRUD
  async create(dto: CreateTutorialDto): Promise<Tutorial> {
    const tutorial = this.tutorialRepo.create({
      ...dto,
      prerequisites: dto.prerequisites || [],
      targetMechanics: dto.targetMechanics || [],
      metadata: dto.metadata || {},
      analytics: {},
    });
    const saved = await this.tutorialRepo.save(tutorial);
    this.logger.log(`Created tutorial: ${saved.id} - ${saved.name}`);
    return saved;
  }

  async findById(id: string): Promise<Tutorial> {
    const tutorial = await this.tutorialRepo.findOne({
      where: { id },
      relations: ['steps'],
    });
    if (!tutorial) {
      throw new NotFoundException(`Tutorial not found: ${id}`);
    }
    return tutorial;
  }

  async findAll(filters?: TutorialFilterDto): Promise<Tutorial[]> {
    const query = this.tutorialRepo.createQueryBuilder('tutorial');

    if (filters?.type) {
      query.andWhere('tutorial.type = :type', { type: filters.type });
    }
    if (filters?.category) {
      query.andWhere('tutorial.category = :category', { category: filters.category });
    }
    if (filters?.difficultyLevel) {
      query.andWhere('tutorial.difficultyLevel = :difficultyLevel', {
        difficultyLevel: filters.difficultyLevel,
      });
    }
    if (filters?.isActive !== undefined) {
      query.andWhere('tutorial.isActive = :isActive', { isActive: filters.isActive });
    }
    if (filters?.targetMechanic) {
      query.andWhere(':mechanic = ANY(tutorial.targetMechanics)', {
        mechanic: filters.targetMechanic,
      });
    }

    query.orderBy('tutorial.order', 'ASC');
    return query.getMany();
  }

  async update(id: string, dto: UpdateTutorialDto): Promise<Tutorial> {
    const tutorial = await this.findById(id);
    Object.assign(tutorial, dto);
    const updated = await this.tutorialRepo.save(tutorial);
    this.logger.log(`Updated tutorial: ${id}`);
    return updated;
  }

  async delete(id: string): Promise<void> {
    const tutorial = await this.findById(id);
    await this.tutorialRepo.softRemove(tutorial);
    this.logger.log(`Soft deleted tutorial: ${id}`);
  }

  // Curriculum Methods
  async getOnboardingCurriculum(): Promise<Tutorial[]> {
    return this.tutorialRepo.find({
      where: { type: 'onboarding', isActive: true },
      relations: ['steps'],
      order: { order: 'ASC' },
    });
  }

  async getTutorialsByMechanic(mechanic: string): Promise<Tutorial[]> {
    return this.tutorialRepo
      .createQueryBuilder('tutorial')
      .where('tutorial.isActive = true')
      .andWhere(':mechanic = ANY(tutorial.targetMechanics)', { mechanic })
      .orderBy('tutorial.difficultyLevel', 'ASC')
      .addOrderBy('tutorial.order', 'ASC')
      .getMany();
  }

  async getRecommendedTutorials(userId: string): Promise<Tutorial[]> {
    // Get user's completed tutorials
    const userProgress = await this.progressRepo.find({
      where: { userId, status: 'completed' },
      select: ['tutorialId'],
    });
    const completedIds = userProgress.map((p) => p.tutorialId);

    // Get in-progress tutorials first
    const inProgress = await this.progressRepo.find({
      where: { userId, status: 'in_progress' },
      relations: ['tutorial'],
    });

    // Get uncompleted active tutorials
    const query = this.tutorialRepo
      .createQueryBuilder('tutorial')
      .where('tutorial.isActive = true');

    if (completedIds.length > 0) {
      query.andWhere('tutorial.id NOT IN (:...completedIds)', { completedIds });
    }

    // Check prerequisites
    const available = await query.orderBy('tutorial.order', 'ASC').getMany();

    const recommended = available.filter((t) => {
      if (!t.prerequisites || t.prerequisites.length === 0) return true;
      return t.prerequisites.every((prereq) => completedIds.includes(prereq));
    });

    // Prioritize in-progress tutorials
    const inProgressTutorials = inProgress.map((p) => p.tutorial).filter(Boolean);
    const notStarted = recommended.filter(
      (t) => !inProgressTutorials.some((ip) => ip?.id === t.id),
    );

    return [...inProgressTutorials, ...notStarted].slice(0, 10);
  }

  async validatePrerequisites(
    userId: string,
    tutorialId: string,
  ): Promise<{ valid: boolean; missing: string[] }> {
    const tutorial = await this.findById(tutorialId);

    if (!tutorial.prerequisites || tutorial.prerequisites.length === 0) {
      return { valid: true, missing: [] };
    }

    const completedProgress = await this.progressRepo.find({
      where: {
        userId,
        tutorialId: In(tutorial.prerequisites),
        status: 'completed',
      },
    });

    const completedIds = new Set(completedProgress.map((p) => p.tutorialId));
    const missing = tutorial.prerequisites.filter((prereq) => !completedIds.has(prereq));

    return {
      valid: missing.length === 0,
      missing,
    };
  }

  // Step Management
  async createStep(dto: CreateTutorialStepDto): Promise<TutorialStep> {
    // Verify tutorial exists
    await this.findById(dto.tutorialId);

    const step = this.stepRepo.create({
      ...dto,
      completionCriteria: dto.completionCriteria || { type: 'auto' },
      adaptivePacing: dto.adaptivePacing || {},
      accessibility: dto.accessibility || {},
      analytics: {},
      localization: {},
    });

    const saved = await this.stepRepo.save(step);
    this.logger.log(`Created step: ${saved.id} for tutorial: ${dto.tutorialId}`);
    return saved;
  }

  async getStepsByTutorial(tutorialId: string): Promise<TutorialStep[]> {
    return this.stepRepo.find({
      where: { tutorialId, isActive: true },
      order: { order: 'ASC' },
    });
  }

  async getStepById(stepId: string): Promise<TutorialStep> {
    const step = await this.stepRepo.findOne({ where: { id: stepId } });
    if (!step) {
      throw new NotFoundException(`Step not found: ${stepId}`);
    }
    return step;
  }

  async updateStep(stepId: string, dto: UpdateTutorialStepDto): Promise<TutorialStep> {
    const step = await this.getStepById(stepId);
    Object.assign(step, dto);
    const updated = await this.stepRepo.save(step);
    this.logger.log(`Updated step: ${stepId}`);
    return updated;
  }

  async deleteStep(stepId: string): Promise<void> {
    const step = await this.getStepById(stepId);
    await this.stepRepo.remove(step);
    this.logger.log(`Deleted step: ${stepId}`);
  }

  async reorderSteps(tutorialId: string, orders: StepOrderDto[]): Promise<void> {
    await this.findById(tutorialId);

    const updates = orders.map((order) =>
      this.stepRepo.update(order.id, { order: order.order }),
    );

    await Promise.all(updates);
    this.logger.log(`Reordered ${orders.length} steps for tutorial: ${tutorialId}`);
  }

  // Analytics Helpers
  async updateTutorialAnalytics(tutorialId: string): Promise<void> {
    const progress = await this.progressRepo.find({
      where: { tutorialId },
    });

    const totalStarted = progress.length;
    const completed = progress.filter((p) => p.status === 'completed');
    const totalCompleted = completed.length;
    const completionTimes = completed
      .filter((p) => p.totalTimeSpent > 0)
      .map((p) => p.totalTimeSpent);
    const averageCompletionTime =
      completionTimes.length > 0
        ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length
        : 0;
    const dropOffRate = totalStarted > 0 ? (totalStarted - totalCompleted) / totalStarted : 0;

    await this.tutorialRepo.update(tutorialId, {
      analytics: {
        totalStarted,
        totalCompleted,
        averageCompletionTime,
        dropOffRate,
        lastCalculatedAt: new Date(),
      },
    });
  }
}
