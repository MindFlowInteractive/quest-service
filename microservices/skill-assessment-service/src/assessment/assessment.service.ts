import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Assessment, AssessmentStatus, AssessmentType, SkillTier } from './entities/assessment.entity';
import { CreateAssessmentDto } from './dto/create-assessment.dto';
import { UpdateAssessmentDto } from './dto/update-assessment.dto';

@Injectable()
export class AssessmentService {
  constructor(
    @InjectRepository(Assessment)
    private assessmentRepository: Repository<Assessment>,
  ) {}

  async create(createAssessmentDto: CreateAssessmentDto): Promise<Assessment> {
    const assessment = this.assessmentRepository.create({
      ...createAssessmentDto,
      status: AssessmentStatus.PENDING,
      difficultyLevel: parseInt(process.env.INITIAL_DIFFICULTY || '1', 10),
    });
    return this.assessmentRepository.save(assessment);
  }

  async findAll(): Promise<Assessment[]> {
    return this.assessmentRepository.find({
      relations: ['results'],
    });
  }

  async findOne(id: string): Promise<Assessment> {
    const assessment = await this.assessmentRepository.findOne({
      where: { id },
      relations: ['results', 'results.test'],
    });
    if (!assessment) {
      throw new NotFoundException(`Assessment with ID ${id} not found`);
    }
    return assessment;
  }

  async findByPlayer(playerId: string): Promise<Assessment[]> {
    return this.assessmentRepository.find({
      where: { playerId },
      relations: ['results', 'results.test'],
      order: { createdAt: 'DESC' },
    });
  }

  async findLatestByPlayer(playerId: string): Promise<Assessment> {
    const assessment = await this.assessmentRepository.findOne({
      where: { playerId },
      relations: ['results', 'results.test'],
      order: { createdAt: 'DESC' },
    });
    if (!assessment) {
      throw new NotFoundException(`No assessment found for player ${playerId}`);
    }
    return assessment;
  }

  async startAssessment(id: string): Promise<Assessment> {
    const assessment = await this.findOne(id);
    assessment.status = AssessmentStatus.IN_PROGRESS;
    assessment.startedAt = new Date();
    return this.assessmentRepository.save(assessment);
  }

  async completeAssessment(id: string): Promise<Assessment> {
    const assessment = await this.findOne(id);
    assessment.status = AssessmentStatus.COMPLETED;
    assessment.completedAt = new Date();
    
    // Calculate overall score from results
    if (assessment.results && assessment.results.length > 0) {
      const totalScore = assessment.results.reduce((sum, result) => sum + result.score, 0);
      assessment.overallScore = totalScore / assessment.results.length;
      
      // Assign tier based on score
      assessment.assignedTier = this.assignTier(assessment.overallScore);
      
      // Schedule next reassessment
      const reassessmentDays = parseInt(process.env.REASSESSMENT_INTERVAL_DAYS || '30', 10);
      assessment.nextReassessmentAt = new Date();
      assessment.nextReassessmentAt.setDate(assessment.nextReassessmentAt.getDate() + reassessmentDays);
    }
    
    return this.assessmentRepository.save(assessment);
  }

  async update(id: string, updateAssessmentDto: UpdateAssessmentDto): Promise<Assessment> {
    const assessment = await this.findOne(id);
    Object.assign(assessment, updateAssessmentDto);
    return this.assessmentRepository.save(assessment);
  }

  async remove(id: string): Promise<void> {
    const assessment = await this.findOne(id);
    await this.assessmentRepository.remove(assessment);
  }

  private assignTier(score: number): SkillTier {
    const thresholds = {
      bronze: parseInt(process.env.TIER_BRONZE_THRESHOLD || '30', 10),
      silver: parseInt(process.env.TIER_SILVER_THRESHOLD || '50', 10),
      gold: parseInt(process.env.TIER_GOLD_THRESHOLD || '70', 10),
      platinum: parseInt(process.env.TIER_PLATINUM_THRESHOLD || '85', 10),
      diamond: parseInt(process.env.TIER_DIAMOND_THRESHOLD || '95', 10),
    };

    if (score >= thresholds.diamond) return SkillTier.DIAMOND;
    if (score >= thresholds.platinum) return SkillTier.PLATINUM;
    if (score >= thresholds.gold) return SkillTier.GOLD;
    if (score >= thresholds.silver) return SkillTier.SILVER;
    return SkillTier.BRONZE;
  }

  async adjustDifficulty(assessmentId: string, performance: number): Promise<Assessment> {
    const assessment = await this.findOne(assessmentId);
    const threshold = parseFloat(process.env.DIFFICULTY_ADJUSTMENT_THRESHOLD || '0.7');
    const maxDifficulty = parseInt(process.env.MAX_DIFFICULTY || '10', 10);
    const minDifficulty = parseInt(process.env.MIN_DIFFICULTY || '1', 10);

    if (performance >= threshold) {
      assessment.difficultyLevel = Math.min(assessment.difficultyLevel + 1, maxDifficulty);
    } else if (performance < threshold - 0.2) {
      assessment.difficultyLevel = Math.max(assessment.difficultyLevel - 1, minDifficulty);
    }

    return this.assessmentRepository.save(assessment);
  }

  async identifySkillGaps(assessmentId: string): Promise<Record<string, number>> {
    const assessment = await this.findOne(assessmentId);
    const skillGaps: Record<string, number> = {};

    if (assessment.results) {
      assessment.results.forEach((result) => {
        const category = result.test.category;
        const score = result.score;
        skillGaps[category] = score;
      });
    }

    assessment.skillGaps = skillGaps;
    return this.assessmentRepository.save(assessment).then((a) => a.skillGaps);
  }
}
