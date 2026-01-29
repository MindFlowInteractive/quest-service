import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { ContextualHelp } from '../entities/contextual-help.entity';
import { ContextualHelpInteraction } from '../entities/contextual-help-interaction.entity';
import {
  CreateContextualHelpDto,
  UpdateContextualHelpDto,
  ContextualHelpFilterDto,
  TriggerContextualHelpDto,
  RecordHelpInteractionDto,
} from '../dto';

@Injectable()
export class ContextualHelpService {
  private readonly logger = new Logger(ContextualHelpService.name);

  constructor(
    @InjectRepository(ContextualHelp)
    private readonly helpRepo: Repository<ContextualHelp>,
    @InjectRepository(ContextualHelpInteraction)
    private readonly interactionRepo: Repository<ContextualHelpInteraction>,
  ) {}

  // CRUD Operations
  async create(dto: CreateContextualHelpDto): Promise<ContextualHelp> {
    const help = this.helpRepo.create({
      ...dto,
      triggerConditions: dto.triggerConditions || {},
      displayRules: dto.displayRules || {},
      localization: {},
      analytics: {},
    });
    const saved = await this.helpRepo.save(help);
    this.logger.log(`Created contextual help: ${saved.id} - ${saved.name}`);
    return saved;
  }

  async findById(id: string): Promise<ContextualHelp> {
    const help = await this.helpRepo.findOne({ where: { id } });
    if (!help) {
      throw new NotFoundException(`Contextual help not found: ${id}`);
    }
    return help;
  }

  async findAll(filters?: ContextualHelpFilterDto): Promise<ContextualHelp[]> {
    const query = this.helpRepo.createQueryBuilder('help');

    if (filters?.triggerContext) {
      query.andWhere('help.triggerContext = :triggerContext', {
        triggerContext: filters.triggerContext,
      });
    }
    if (filters?.targetFeature) {
      query.andWhere('help.targetFeature = :targetFeature', {
        targetFeature: filters.targetFeature,
      });
    }
    if (filters?.targetPuzzleType) {
      query.andWhere('help.targetPuzzleType = :targetPuzzleType', {
        targetPuzzleType: filters.targetPuzzleType,
      });
    }
    if (filters?.isActive !== undefined) {
      query.andWhere('help.isActive = :isActive', { isActive: filters.isActive });
    }

    query.orderBy('help.priority', 'DESC');
    return query.getMany();
  }

  async update(id: string, dto: UpdateContextualHelpDto): Promise<ContextualHelp> {
    const help = await this.findById(id);
    Object.assign(help, dto);
    const updated = await this.helpRepo.save(help);
    this.logger.log(`Updated contextual help: ${id}`);
    return updated;
  }

  async delete(id: string): Promise<void> {
    const help = await this.findById(id);
    await this.helpRepo.remove(help);
    this.logger.log(`Deleted contextual help: ${id}`);
  }

  // Trigger Logic
  async triggerHelp(
    userId: string,
    dto: TriggerContextualHelpDto,
  ): Promise<ContextualHelp | null> {
    const applicable = await this.getApplicableHelp(userId, dto);

    if (applicable.length === 0) {
      return null;
    }

    // Pick highest priority help that should be shown
    for (const help of applicable) {
      if (await this.shouldShowHelp(userId, help.id)) {
        // Record that help was shown
        await this.recordInteraction(userId, {
          helpId: help.id,
          action: 'shown',
          context: {
            puzzleId: dto.puzzleId,
          },
        });

        // Update analytics
        await this.updateHelpAnalytics(help.id, 'shown');

        return help;
      }
    }

    return null;
  }

  async getApplicableHelp(
    userId: string,
    dto: TriggerContextualHelpDto,
  ): Promise<ContextualHelp[]> {
    const query = this.helpRepo
      .createQueryBuilder('help')
      .where('help.isActive = true')
      .andWhere('help.triggerContext = :context', { context: dto.context });

    if (dto.feature) {
      query.andWhere('(help.targetFeature IS NULL OR help.targetFeature = :feature)', {
        feature: dto.feature,
      });
    }

    if (dto.puzzleType) {
      query.andWhere('(help.targetPuzzleType IS NULL OR help.targetPuzzleType = :puzzleType)', {
        puzzleType: dto.puzzleType,
      });
    }

    const candidates = await query.orderBy('help.priority', 'DESC').getMany();

    // Filter by trigger conditions
    const filtered = candidates.filter((help) =>
      this.checkTriggerConditions(help, dto),
    );

    return filtered;
  }

  async shouldShowHelp(userId: string, helpId: string): Promise<boolean> {
    const help = await this.findById(helpId);
    const rules = help.displayRules;

    // Check showOnce
    if (rules.showOnce) {
      const shown = await this.interactionRepo.findOne({
        where: { userId, helpId, action: 'shown' },
      });
      if (shown) return false;
    }

    // Check maxShowCount
    if (rules.maxShowCount) {
      const showCount = await this.getShowCount(userId, helpId);
      if (showCount >= rules.maxShowCount) return false;
    }

    // Check cooldown
    if (rules.cooldownSeconds) {
      const lastShown = await this.getLastShownTime(userId, helpId);
      if (lastShown) {
        const cooldownEnd = new Date(lastShown.getTime() + rules.cooldownSeconds * 1000);
        if (new Date() < cooldownEnd) return false;
      }
    }

    return true;
  }

  private checkTriggerConditions(
    help: ContextualHelp,
    dto: TriggerContextualHelpDto,
  ): boolean {
    const conditions = help.triggerConditions;

    if (conditions.minAttempts !== undefined && dto.attempts !== undefined) {
      if (dto.attempts < conditions.minAttempts) return false;
    }

    if (conditions.maxAttempts !== undefined && dto.attempts !== undefined) {
      if (dto.attempts > conditions.maxAttempts) return false;
    }

    if (conditions.timeThreshold !== undefined && dto.timeSpent !== undefined) {
      if (dto.timeSpent < conditions.timeThreshold) return false;
    }

    if (conditions.userLevel && dto.userLevel !== undefined) {
      if (conditions.userLevel.min !== undefined && dto.userLevel < conditions.userLevel.min) {
        return false;
      }
      if (conditions.userLevel.max !== undefined && dto.userLevel > conditions.userLevel.max) {
        return false;
      }
    }

    if (conditions.errorPatterns && dto.recentErrors) {
      const hasMatchingError = conditions.errorPatterns.some((pattern) =>
        dto.recentErrors!.some((error) => error.includes(pattern)),
      );
      if (!hasMatchingError) return false;
    }

    return true;
  }

  // Interaction Tracking
  async recordInteraction(userId: string, dto: RecordHelpInteractionDto): Promise<void> {
    const help = await this.findById(dto.helpId);

    const interaction = this.interactionRepo.create({
      userId,
      helpId: dto.helpId,
      triggerContext: help.triggerContext,
      action: dto.action,
      viewDuration: dto.viewDuration,
      actionTaken: dto.actionTaken,
      context: dto.context,
    });

    await this.interactionRepo.save(interaction);

    // Update analytics based on action
    await this.updateHelpAnalytics(dto.helpId, dto.action);
  }

  async getUserHelpHistory(userId: string, helpId?: string): Promise<ContextualHelpInteraction[]> {
    const where: any = { userId };
    if (helpId) {
      where.helpId = helpId;
    }

    return this.interactionRepo.find({
      where,
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async getShowCount(userId: string, helpId: string): Promise<number> {
    return this.interactionRepo.count({
      where: { userId, helpId, action: 'shown' },
    });
  }

  async getLastShownTime(userId: string, helpId: string): Promise<Date | null> {
    const interaction = await this.interactionRepo.findOne({
      where: { userId, helpId, action: 'shown' },
      order: { createdAt: 'DESC' },
    });
    return interaction?.createdAt || null;
  }

  // Integration Points
  async getHelpForPuzzleStart(
    userId: string,
    puzzleType: string,
  ): Promise<ContextualHelp | null> {
    return this.triggerHelp(userId, {
      context: 'puzzle_start',
      puzzleType,
    });
  }

  async getHelpForRepeatedFailure(
    userId: string,
    puzzleId: string,
    attempts: number,
  ): Promise<ContextualHelp | null> {
    return this.triggerHelp(userId, {
      context: 'repeated_failure',
      puzzleId,
      attempts,
    });
  }

  async getHelpForFeature(userId: string, feature: string): Promise<ContextualHelp | null> {
    return this.triggerHelp(userId, {
      context: 'feature_discovery',
      feature,
    });
  }

  // Analytics Updates
  private async updateHelpAnalytics(helpId: string, action: string): Promise<void> {
    const help = await this.findById(helpId);
    const analytics = help.analytics || {};

    if (action === 'shown') {
      analytics.totalShown = (analytics.totalShown || 0) + 1;
    }

    if (action === 'dismissed') {
      const totalShown = analytics.totalShown || 1;
      const dismissed = await this.interactionRepo.count({
        where: { helpId, action: 'dismissed' },
      });
      analytics.dismissRate = dismissed / totalShown;
    }

    if (action === 'clicked' || action === 'completed') {
      const totalShown = analytics.totalShown || 1;
      const actioned = await this.interactionRepo.count({
        where: { helpId, action: 'clicked' },
      });
      analytics.actionTakenRate = actioned / totalShown;
    }

    await this.helpRepo.update(helpId, { analytics });
  }
}
