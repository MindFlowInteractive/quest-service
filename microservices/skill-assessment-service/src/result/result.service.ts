import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Result } from './entities/result.entity';
import { CreateResultDto } from './dto/create-result.dto';

@Injectable()
export class ResultService {
  constructor(
    @InjectRepository(Result)
    private resultRepository: Repository<Result>,
  ) {}

  async create(createResultDto: CreateResultDto): Promise<Result> {
    const result = this.resultRepository.create(createResultDto);
    
    // Calculate performance metrics
    result.performanceMetrics = this.calculatePerformanceMetrics(result);
    
    return this.resultRepository.save(result);
  }

  async findAll(): Promise<Result[]> {
    return this.resultRepository.find({
      relations: ['assessment', 'test'],
    });
  }

  async findOne(id: string): Promise<Result> {
    const result = await this.resultRepository.findOne({
      where: { id },
      relations: ['assessment', 'test'],
    });
    if (!result) {
      throw new NotFoundException(`Result with ID ${id} not found`);
    }
    return result;
  }

  async findByAssessment(assessmentId: string): Promise<Result[]> {
    return this.resultRepository.find({
      where: { assessmentId },
      relations: ['test'],
    });
  }

  async findByTest(testId: string): Promise<Result[]> {
    return this.resultRepository.find({
      where: { testId },
      relations: ['assessment'],
    });
  }

  async calculateAverageScore(assessmentId: string): Promise<number> {
    const results = await this.findByAssessment(assessmentId);
    if (results.length === 0) return 0;
    
    const totalScore = results.reduce((sum, result) => sum + result.score, 0);
    return totalScore / results.length;
  }

  private calculatePerformanceMetrics(result: Result): Record<string, number> {
    const accuracy = result.questionsAnswered > 0 
      ? (result.correctAnswers / result.questionsAnswered) * 100 
      : 0;
    
    const avgTimePerQuestion = result.questionsAnswered > 0 
      ? result.timeTaken / result.questionsAnswered 
      : 0;

    return {
      accuracy,
      avgTimePerQuestion,
      completionRate: (result.questionsAnswered / result.test.questions.length) * 100,
    };
  }
}
