import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Assessment, SkillTier } from '../assessment/entities/assessment.entity';
import { Result } from '../result/entities/result.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Assessment)
    private assessmentRepository: Repository<Assessment>,
    @InjectRepository(Result)
    private resultRepository: Repository<Result>,
  ) {}

  async getPlayerSkillTrajectory(playerId: string): Promise<any> {
    const assessments = await this.assessmentRepository.find({
      where: { playerId },
      relations: ['results'],
      order: { createdAt: 'ASC' },
    });

    const trajectory = assessments.map((assessment) => ({
      date: assessment.createdAt,
      overallScore: assessment.overallScore,
      tier: assessment.assignedTier,
      difficultyLevel: assessment.difficultyLevel,
      skillGaps: assessment.skillGaps,
    }));

    return {
      playerId,
      trajectory,
      improvement: this.calculateImprovement(trajectory),
    };
  }

  async getAssessmentAnalytics(): Promise<any> {
    const totalAssessments = await this.assessmentRepository.count();
    const completedAssessments = await this.assessmentRepository.count({
      where: { status: 'completed' as any },
    });

    const tierDistribution = await this.getTierDistribution();
    const averageScores = await this.getAverageScoresByCategory();
    const completionRate = totalAssessments > 0 
      ? (completedAssessments / totalAssessments) * 100 
      : 0;

    return {
      totalAssessments,
      completedAssessments,
      completionRate,
      tierDistribution,
      averageScoresByCategory: averageScores,
    };
  }

  async getPlayerAnalytics(playerId: string): Promise<any> {
    const assessments = await this.assessmentRepository.find({
      where: { playerId },
      relations: ['results'],
      order: { createdAt: 'DESC' },
    });

    if (assessments.length === 0) {
      return {
        playerId,
        totalAssessments: 0,
        currentTier: null,
        averageScore: 0,
        skillGaps: {},
      };
    }

    const latestAssessment = assessments[0];
    const averageScore = assessments.reduce((sum, a) => sum + (a.overallScore || 0), 0) / assessments.length;
    
    const skillGaps = this.aggregateSkillGaps(assessments);

    return {
      playerId,
      totalAssessments: assessments.length,
      currentTier: latestAssessment.assignedTier,
      averageScore,
      skillGaps,
      latestAssessmentDate: latestAssessment.createdAt,
      nextReassessmentAt: latestAssessment.nextReassessmentAt,
    };
  }

  async getSkillGapAnalysis(playerId: string): Promise<any> {
    const assessments = await this.assessmentRepository.find({
      where: { playerId },
      relations: ['results', 'results.test'],
      order: { createdAt: 'DESC' },
      take: 5,
    });

    const skillGaps: Record<string, { score: number; count: number; average: number }> = {};

    assessments.forEach((assessment) => {
      if (assessment.results) {
        assessment.results.forEach((result) => {
          const category = result.test.category;
          if (!skillGaps[category]) {
            skillGaps[category] = { score: 0, count: 0, average: 0 };
          }
          skillGaps[category].score += result.score;
          skillGaps[category].count += 1;
          skillGaps[category].average = skillGaps[category].score / skillGaps[category].count;
        });
      }
    });

    const identifiedGaps = Object.entries(skillGaps)
      .filter(([_, data]) => data.average < 60)
      .map(([category, data]) => ({
        category,
        averageScore: data.average,
        needsImprovement: true,
      }));

    return {
      playerId,
      skillGaps,
      identifiedGaps,
      recommendations: this.generateRecommendations(identifiedGaps),
    };
  }

  private calculateImprovement(trajectory: any[]): number {
    if (trajectory.length < 2) return 0;
    const first = trajectory[0].overallScore || 0;
    const last = trajectory[trajectory.length - 1].overallScore || 0;
    return last - first;
  }

  private async getTierDistribution(): Promise<Record<string, number>> {
    const assessments = await this.assessmentRepository.find({
      where: { status: 'completed' as any },
    });

    const distribution: Record<string, number> = {
      bronze: 0,
      silver: 0,
      gold: 0,
      platinum: 0,
      diamond: 0,
    };

    assessments.forEach((assessment) => {
      if (assessment.assignedTier) {
        distribution[assessment.assignedTier]++;
      }
    });

    return distribution;
  }

  private async getAverageScoresByCategory(): Promise<Record<string, number>> {
    const results = await this.resultRepository.find({
      relations: ['test'],
    });

    const categoryScores: Record<string, number[]> = {};

    results.forEach((result) => {
      const category = result.test.category;
      if (!categoryScores[category]) {
        categoryScores[category] = [];
      }
      categoryScores[category].push(result.score);
    });

    const averages: Record<string, number> = {};
    Object.entries(categoryScores).forEach(([category, scores]) => {
      averages[category] = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    });

    return averages;
  }

  private aggregateSkillGaps(assessments: Assessment[]): Record<string, number> {
    const aggregated: Record<string, number[]> = {};

    assessments.forEach((assessment) => {
      if (assessment.skillGaps) {
        Object.entries(assessment.skillGaps).forEach(([category, score]) => {
          if (!aggregated[category]) {
            aggregated[category] = [];
          }
          aggregated[category].push(score as number);
        });
      }
    });

    const result: Record<string, number> = {};
    Object.entries(aggregated).forEach(([category, scores]) => {
      result[category] = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    });

    return result;
  }

  private generateRecommendations(gaps: any[]): string[] {
    const recommendations: string[] = [];

    gaps.forEach((gap) => {
      recommendations.push(`Focus on improving ${gap.category} skills through targeted practice`);
      recommendations.push(`Consider taking additional tests in ${gap.category} to build proficiency`);
    });

    if (recommendations.length === 0) {
      recommendations.push('No significant skill gaps identified. Continue with regular practice.');
    }

    return recommendations;
  }
}
