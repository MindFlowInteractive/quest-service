import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Recommendation } from '../entities/recommendation.entity';

interface ABTestConfig {
  name: string;
  variants: ABTestVariant[];
  trafficAllocation: number; // 0.0 to 1.0
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
}

interface ABTestVariant {
  name: string;
  algorithm: 'collaborative' | 'content-based' | 'hybrid' | 'popular';
  weight: number; // Relative weight for traffic distribution
  config?: any; // Additional configuration for the variant
}

interface ABTestResult {
  testName: string;
  variant: string;
  totalRecommendations: number;
  views: number;
  clicks: number;
  completions: number;
  clickThroughRate: number;
  completionRate: number;
  averageScore: number;
}

@Injectable()
export class ABTestingService {
  private readonly logger = new Logger(ABTestingService.name);
  
  // In a production environment, this would be stored in a database
  private readonly activeTests: Map<string, ABTestConfig> = new Map();

  constructor(
    @InjectRepository(Recommendation)
    private recommendationRepository: Repository<Recommendation>,
  ) {
    this.initializeDefaultTests();
  }

  private initializeDefaultTests(): void {
    // Default A/B test comparing different algorithms
    const algorithmComparisonTest: ABTestConfig = {
      name: 'algorithm_comparison_v1',
      variants: [
        {
          name: 'collaborative_only',
          algorithm: 'collaborative',
          weight: 25,
        },
        {
          name: 'content_only',
          algorithm: 'content-based',
          weight: 25,
        },
        {
          name: 'hybrid_default',
          algorithm: 'hybrid',
          weight: 40,
        },
        {
          name: 'popular_baseline',
          algorithm: 'popular',
          weight: 10,
        },
      ],
      trafficAllocation: 0.3, // 30% of users in this test
      startDate: new Date('2024-01-01'),
      isActive: true,
    };

    this.activeTests.set(algorithmComparisonTest.name, algorithmComparisonTest);

    // Test for new user onboarding
    const newUserTest: ABTestConfig = {
      name: 'new_user_onboarding_v1',
      variants: [
        {
          name: 'popular_first',
          algorithm: 'popular',
          weight: 50,
        },
        {
          name: 'diverse_categories',
          algorithm: 'content-based',
          weight: 50,
          config: {
            diversityBoost: true,
            categorySpread: 0.8,
          },
        },
      ],
      trafficAllocation: 0.5, // 50% of new users
      startDate: new Date('2024-01-15'),
      isActive: true,
    };

    this.activeTests.set(newUserTest.name, newUserTest);
  }

  assignUserToTest(userId: string, userInteractionCount: number = 0): string | null {
    // Determine which test the user should be in based on their profile
    let selectedTest: ABTestConfig | null = null;

    if (userInteractionCount < 5) {
      // New users go to new user onboarding test
      selectedTest = this.activeTests.get('new_user_onboarding_v1') || null;
    } else {
      // Experienced users go to algorithm comparison test
      selectedTest = this.activeTests.get('algorithm_comparison_v1') || null;
    }

    if (!selectedTest || !selectedTest.isActive) {
      return null;
    }

    // Check if user should be included in the test based on traffic allocation
    const userHash = this.hashUserId(userId);
    const trafficThreshold = selectedTest.trafficAllocation * 100;
    
    if (userHash % 100 >= trafficThreshold) {
      return null; // User not in test
    }

    // Assign user to a variant based on weights
    const variant = this.selectVariant(selectedTest.variants, userHash);
    
    if (variant) {
      const testGroup = `${selectedTest.name}_${variant.name}`;
      this.logger.log(`User ${userId} assigned to A/B test group: ${testGroup}`);
      return testGroup;
    }

    return null;
  }

  private hashUserId(userId: string): number {
    // Simple hash function for consistent user assignment
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private selectVariant(variants: ABTestVariant[], userHash: number): ABTestVariant | null {
    const totalWeight = variants.reduce((sum, variant) => sum + variant.weight, 0);
    const threshold = (userHash % 100) / 100 * totalWeight;
    
    let cumulativeWeight = 0;
    for (const variant of variants) {
      cumulativeWeight += variant.weight;
      if (threshold <= cumulativeWeight) {
        return variant;
      }
    }

    return variants[variants.length - 1]; // Fallback to last variant
  }

  getAlgorithmForTestGroup(testGroup: string): string {
    const [testName, variantName] = testGroup.split('_', 2);
    const test = this.activeTests.get(`${testName}_${variantName.split('_')[0]}_v1`);
    
    if (!test) {
      return 'hybrid'; // Default fallback
    }

    const variant = test.variants.find(v => v.name === variantName);
    return variant?.algorithm || 'hybrid';
  }

  async getTestResults(testName: string, startDate?: Date, endDate?: Date): Promise<ABTestResult[]> {
    const test = this.activeTests.get(testName);
    if (!test) {
      throw new Error(`Test ${testName} not found`);
    }

    const results: ABTestResult[] = [];

    for (const variant of test.variants) {
      const testGroup = `${testName}_${variant.name}`;
      
      let query = this.recommendationRepository
        .createQueryBuilder('rec')
        .select([
          'COUNT(*) as total_recommendations',
          'SUM(CASE WHEN rec.wasViewed THEN 1 ELSE 0 END) as views',
          'SUM(CASE WHEN rec.wasClicked THEN 1 ELSE 0 END) as clicks',
          'SUM(CASE WHEN rec.wasCompleted THEN 1 ELSE 0 END) as completions',
          'AVG(rec.score) as avg_score',
        ])
        .where("rec.metadata->>'abTestGroup' = :testGroup", { testGroup });

      if (startDate) {
        query = query.andWhere('rec.createdAt >= :startDate', { startDate });
      }

      if (endDate) {
        query = query.andWhere('rec.createdAt <= :endDate', { endDate });
      }

      const result = await query.getRawOne();

      const totalRecommendations = parseInt(result.total_recommendations) || 0;
      const views = parseInt(result.views) || 0;
      const clicks = parseInt(result.clicks) || 0;
      const completions = parseInt(result.completions) || 0;

      results.push({
        testName,
        variant: variant.name,
        totalRecommendations,
        views,
        clicks,
        completions,
        clickThroughRate: views > 0 ? clicks / views : 0,
        completionRate: clicks > 0 ? completions / clicks : 0,
        averageScore: parseFloat(result.avg_score) || 0,
      });
    }

    return results;
  }

  async getActiveTests(): Promise<string[]> {
    return Array.from(this.activeTests.keys()).filter(testName => {
      const test = this.activeTests.get(testName);
      return test?.isActive && (!test.endDate || test.endDate > new Date());
    });
  }

  createTest(config: ABTestConfig): void {
    this.activeTests.set(config.name, config);
    this.logger.log(`Created A/B test: ${config.name}`);
  }

  stopTest(testName: string): void {
    const test = this.activeTests.get(testName);
    if (test) {
      test.isActive = false;
      test.endDate = new Date();
      this.logger.log(`Stopped A/B test: ${testName}`);
    }
  }

  async calculateStatisticalSignificance(
    testName: string,
    metric: 'clickThroughRate' | 'completionRate' = 'clickThroughRate',
  ): Promise<any> {
    const results = await this.getTestResults(testName);
    
    if (results.length < 2) {
      return { error: 'Need at least 2 variants for significance testing' };
    }

    // Simple statistical significance calculation
    // In production, you'd want to use a proper statistical library
    const controlVariant = results[0];
    const testVariants = results.slice(1);

    const significanceResults = testVariants.map(variant => {
      const controlRate = controlVariant[metric];
      const testRate = variant[metric];
      
      // Calculate sample sizes
      const controlSample = metric === 'clickThroughRate' ? controlVariant.views : controlVariant.clicks;
      const testSample = metric === 'clickThroughRate' ? variant.views : variant.clicks;
      
      // Simple z-test approximation
      const pooledRate = (controlRate * controlSample + testRate * testSample) / (controlSample + testSample);
      const standardError = Math.sqrt(pooledRate * (1 - pooledRate) * (1/controlSample + 1/testSample));
      const zScore = Math.abs(controlRate - testRate) / standardError;
      
      // Approximate p-value (two-tailed test)
      const pValue = 2 * (1 - this.normalCDF(Math.abs(zScore)));
      
      return {
        variant: variant.variant,
        controlRate,
        testRate,
        improvement: ((testRate - controlRate) / controlRate) * 100,
        zScore,
        pValue,
        isSignificant: pValue < 0.05,
        confidenceLevel: (1 - pValue) * 100,
      };
    });

    return {
      testName,
      metric,
      controlVariant: controlVariant.variant,
      results: significanceResults,
    };
  }

  private normalCDF(x: number): number {
    // Approximation of the cumulative distribution function for standard normal distribution
    return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
  }

  private erf(x: number): number {
    // Approximation of the error function
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;

    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }
}