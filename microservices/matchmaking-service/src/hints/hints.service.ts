import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, MoreThanOrEqual } from 'typeorm';
import { Hint } from './entities/hint.entity';
import { HintUsage } from './entities/hint-usage.entity';
import { HintTemplate } from './entities/hint-template.entity';
import { CreateHintDto, RequestHintDto, HintUsageDto, HintType } from './dto/create-hint.dto';
import { generateAlgorithmicHints } from './algorithms/engine';

type Nullable<T> = T | null;

@Injectable()
export class HintsService {
  constructor(
    @InjectRepository(Hint)
    private readonly hintRepo: Repository<Hint>,
    @InjectRepository(HintUsage)
    private readonly usageRepo: Repository<HintUsage>,
    @InjectRepository(HintTemplate)
    private readonly templateRepo: Repository<HintTemplate>,
  ) {}

  async createHint(dto: CreateHintDto): Promise<Hint> {
    const hint = this.hintRepo.create({
      ...dto,
      type: dto.type,
      skillLevelTarget: dto.skillLevelTarget ?? {},
      contextualData: dto.contextualData,
    });
    return this.hintRepo.save(hint);
  }

  // Core entry: progressive, contextual, and non-spoiling hint selection
  async requestHint(dto: RequestHintDto): Promise<Hint> {
    this.assertNotAbusing(dto);

    // Cost/limit checks
    await this.enforceHintLimits(dto.userId, dto.puzzleId);

    // Gather candidates for this puzzle, ordered progressively
    const where: FindOptionsWhere<Hint> = {
      puzzleId: dto.puzzleId,
      isActive: true,
    } as any;

    const candidates = await this.hintRepo.find({
      where,
      order: { order: 'ASC' },
    });

    if (candidates.length === 0) {
      // Try generating from templates as fallback
      const generated = await this.generateFromTemplates(dto);
      if (!generated) {
        throw new BadRequestException('No hints available for this puzzle');
      }
      return generated;
    }

    // Determine next progressive level based on prior usage
    const priorCount = await this.usageRepo.count({
      where: { userId: dto.userId, puzzleId: dto.puzzleId },
    });

    // Progressive selection: pick the first candidate with order > priorCount
    const progressive = candidates.find((h) => h.order > priorCount) ?? candidates[candidates.length - 1];

    // Contextual adjustment without spoiling: prefer contextual/strategic before specific
    const filtered = this.rankByContextAndPersonalization(candidates, dto, progressive.order);

    // Final pick is the first ranked candidate
    const selected = filtered[0];

    // Record a provisional usage row (without completion yet)
    await this.recordUsageInternal({
      hintId: selected.id,
      puzzleId: dto.puzzleId,
      userId: dto.userId,
      attemptNumber: dto.attemptNumber,
      timeSpent: dto.timeSpent,
      ledToCompletion: false,
      satisfactionRating: 3,
      playerState: dto.playerState,
      puzzleState: dto.puzzleState,
    });

    // Update usage counters for analytics (non-blocking)
    void this.hintRepo.update(selected.id, {
      usageCount: (selected.usageCount ?? 0) + 1,
      analytics: {
        ...selected.analytics,
      },
    });

    return selected;
  }

  // Explicit recording after the player uses a hint and proceeds
  async recordUsage(dto: HintUsageDto): Promise<HintUsage> {
    const usage = await this.recordUsageInternal(dto);

    // Update effectiveness based on completion and satisfaction
    const hint = await this.hintRepo.findOne({ where: { id: dto.hintId } });
    if (hint) {
      const successCount = (hint.successCount ?? 0) + (dto.ledToCompletion ? 1 : 0);
      const usageCount = (hint.usageCount ?? 0) + 1;
      const completionRate = successCount > 0 ? successCount / usageCount : 0;
      const effectiveness = Math.min(1, Math.max(0, 0.6 * completionRate + 0.4 * (dto.satisfactionRating / 5)));
      await this.hintRepo.update(hint.id, {
        successCount,
        usageCount,
        effectiveness,
        analytics: {
          ...hint.analytics,
          completionRate,
        },
      });
    }

    return usage;
  }

  // Templates management
  async listTemplates(params?: { puzzleType?: string; difficulty?: string; activeOnly?: boolean }): Promise<HintTemplate[]> {
    const where: FindOptionsWhere<HintTemplate> = {} as any;
    if (params?.puzzleType) (where as any).puzzleType = params.puzzleType;
    if (params?.difficulty) (where as any).difficulty = params.difficulty as any;
    if (params?.activeOnly) (where as any).isActive = true;
    return this.templateRepo.find({ where, order: { order: 'ASC' } });
  }

  async createTemplate(input: Partial<HintTemplate>): Promise<HintTemplate> {
    const template = this.templateRepo.create({
      ...input,
      isActive: input.isActive ?? true,
      usageCount: 0,
      effectiveness: 0,
      analytics: {},
    });
    return this.templateRepo.save(template);
  }

  async updateTemplate(id: string, input: Partial<HintTemplate>): Promise<HintTemplate> {
    const existing = await this.templateRepo.findOne({ where: { id } });
    if (!existing) throw new BadRequestException('Template not found');
    const updated = { ...existing, ...input, id: existing.id } as HintTemplate;
    await this.templateRepo.save(updated);
    return updated;
  }

  async toggleTemplate(id: string, isActive: boolean): Promise<HintTemplate> {
    const existing = await this.templateRepo.findOne({ where: { id } });
    if (!existing) throw new BadRequestException('Template not found');
    existing.isActive = isActive;
    return this.templateRepo.save(existing);
  }

  async seedDefaultTemplates(): Promise<{ created: number }> {
    const defaults: Array<Partial<HintTemplate>> = [
      {
        name: 'MCQ General 1',
        description: 'General guidance for MCQ without spoilers',
        puzzleType: 'multiple-choice',
        category: 'general',
        difficulty: 'medium',
        order: 1,
        type: 'general',
        template: 'Eliminate obviously wrong options and compare remaining choices.',
        variables: {},
        conditions: {},
        cost: 0,
        pointsPenalty: 0,
        isActive: true,
      },
      {
        name: 'Logic Grid Context 2',
        description: 'Contextual nudge based on constraints',
        puzzleType: 'logic-grid',
        category: 'contextual',
        difficulty: 'medium',
        order: 2,
        type: 'contextual',
        template: 'Look again at the constraint linking {{currentStep}}; resolve contradictions first.',
        variables: { currentStep: { type: 'string', description: 'Current solving focus', required: false } as any },
        conditions: {},
        cost: 0,
        pointsPenalty: 0,
        isActive: true,
      },
      {
        name: 'Code Strategic 3',
        description: 'Strategy hint for code puzzles',
        puzzleType: 'code',
        category: 'strategic',
        difficulty: 'hard',
        order: 3,
        type: 'strategic',
        template: 'Create a minimal repro for the failing case and add an assertion around {{progress}}.',
        variables: { progress: { type: 'number', description: 'Progress percent', required: false } as any },
        conditions: { minSkillLevel: 2 },
        cost: 1,
        pointsPenalty: 0,
        isActive: true,
      },
      {
        name: 'Visual Specific 4',
        description: 'Specific but non-spoiling nudge',
        puzzleType: 'visual',
        category: 'specific',
        difficulty: 'easy',
        order: 4,
        type: 'specific',
        template: 'Focus on the outer boundary; check repeated shapes before moving inward.',
        variables: {},
        conditions: {},
        cost: 2,
        pointsPenalty: 1,
        isActive: true,
      },
    ];

    let created = 0;
    for (const d of defaults) {
      const exists = await this.templateRepo.findOne({ where: { name: d.name as string } });
      if (!exists) {
        const t = this.templateRepo.create(d);
        await this.templateRepo.save(t);
        created += 1;
      }
    }
    return { created };
  }

  // Internals
  private async generateFromTemplates(dto: RequestHintDto): Promise<Nullable<Hint>> {
    // Basic generation by puzzle type/difficulty inferred from puzzle state
    const puzzleType = (dto.puzzleState as any)?.type ?? 'logic-grid';
    const difficulty = (dto.puzzleState as any)?.difficulty ?? 'medium';
    const templates = await this.listTemplates({ puzzleType, difficulty, activeOnly: true });
    if (templates.length === 0) {
      // Fall back to algorithmic generation when no templates exist
      const alg = generateAlgorithmicHints({
        puzzleType: (dto.puzzleState as any)?.type ?? 'logic-grid',
        difficulty: (dto.puzzleState as any)?.difficulty ?? 'medium',
        puzzleState: dto.puzzleState,
        playerState: dto.playerState,
      });
      if (!alg.length) return null;
      const chosen = alg[0];
      const hint = this.hintRepo.create({
        puzzleId: dto.puzzleId,
        order: chosen.order,
        type: chosen.type as any,
        content: chosen.content,
        cost: 0,
        pointsPenalty: 0,
        isActive: true,
        skillLevelTarget: {},
      });
      return this.hintRepo.save(hint);
    }

    // Pick first progressive template not used yet by order
    const priorCount = await this.usageRepo.count({ where: { userId: dto.userId, puzzleId: dto.puzzleId } });
    const selectedTemplate = templates.find((t) => t.order > priorCount) ?? templates[templates.length - 1];

    const content = this.fillTemplate(selectedTemplate.template, {
      progress: (dto.puzzleState as any)?.progress ?? 0,
      errors: (dto.puzzleState as any)?.errors ?? [],
      currentStep: (dto.puzzleState as any)?.currentStep ?? 'start',
    });

    const hint = this.hintRepo.create({
      puzzleId: dto.puzzleId,
      order: selectedTemplate.order,
      type: selectedTemplate.type as any,
      content,
      cost: selectedTemplate.cost ?? 0,
      pointsPenalty: selectedTemplate.pointsPenalty ?? 0,
      isActive: true,
      skillLevelTarget: selectedTemplate.conditions
        ? { minLevel: selectedTemplate.conditions.minSkillLevel, maxLevel: selectedTemplate.conditions.maxSkillLevel }
        : {},
    });
    return this.hintRepo.save(hint);
  }

  private fillTemplate(template: string, vars: Record<string, any>): string {
    return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => {
      const value = vars[key];
      if (Array.isArray(value)) return value.join(', ');
      if (value === undefined || value === null) return '';
      return String(value);
    });
  }

  private rankByContextAndPersonalization(candidates: Hint[], dto: RequestHintDto, minOrder: number): Hint[] {
    const skill = dto.playerState?.skillLevel ?? 0;
    const prevHints = dto.playerState?.previousHintsUsed ?? 0;
    const time = dto.timeSpent ?? 0;
    const attempt = dto.attemptNumber ?? 1;

    const orderWeight = 3;
    const typeWeight = 2;
    const personalizationWeight = 2;
    const effectivenessWeight = 1;

    const typeBaseScore = (t: HintType | string): number => {
      switch (t) {
        case HintType.GENERAL:
          return 3;
        case HintType.CONTEXTUAL:
          return 4;
        case HintType.STRATEGIC:
          return 4;
        case HintType.SPECIFIC:
          return 1; // avoid spoiling
        case HintType.TUTORIAL:
          return attempt <= 1 ? 5 : 2;
        default:
          return 2;
      }
    };

    const scored = candidates
      .filter((h) => h.order >= minOrder)
      .map((h: Hint) => {
        const typeScore = typeBaseScore(h.type as any);
        const inRange = this.isSkillInRange(skill, h.skillLevelTarget);
        const personalizationScore = inRange ? 1 : 0;
        const effScore = Number(h.effectiveness ?? 0);
        const orderScore = 1 / (1 + Math.max(0, h.order - minOrder));
        const score =
          orderWeight * orderScore +
          typeWeight * typeScore +
          personalizationWeight * personalizationScore +
          effectivenessWeight * effScore +
          (time > 120 ? 0.5 : 0) +
          (prevHints > 0 ? -0.2 * prevHints : 0);
        return { h, score };
      })
      .sort((a, b) => b.score - a.score)
      .map((x) => x.h);

    return scored.length > 0 ? scored : candidates;
  }

  private isSkillInRange(skill: number, target?: { minLevel?: number; maxLevel?: number; preferredLevel?: number }): boolean {
    if (!target) return true;
    const min = target.minLevel ?? -Infinity;
    const max = target.maxLevel ?? Infinity;
    return skill >= min && skill <= max;
  }

  private async enforceHintLimits(userId: string, puzzleId: string): Promise<void> {
    // Simple limits: max 3 hints per puzzle per user, cooldown 15s after each request
    const now = new Date();
    const since = new Date(now.getTime() - 15 * 1000);

    const count = await this.usageRepo.count({ where: { userId, puzzleId } });
    if (count >= 3) {
      throw new ForbiddenException('Hint limit reached for this puzzle');
    }

    const recent = await this.usageRepo.find({
      where: {
        userId,
        puzzleId,
        createdAt: MoreThanOrEqual(since as any),
      } as any,
      order: { createdAt: 'DESC' },
      take: 1,
    });
    if (recent.length > 0) {
      throw new ForbiddenException('Please wait before requesting another hint');
    }
  }

  private assertNotAbusing(dto: RequestHintDto): void {
    const rapidAttempts = dto.attemptNumber > 5 && (dto.timeSpent ?? 0) < 5;
    if (rapidAttempts) {
      throw new ForbiddenException('Hint abuse detected');
    }
  }

  private async recordUsageInternal(dto: HintUsageDto): Promise<HintUsage> {
    const usage = this.usageRepo.create({
      ...dto,
      isAbuseAttempt: false,
    });
    return this.usageRepo.save(usage);
  }
}


