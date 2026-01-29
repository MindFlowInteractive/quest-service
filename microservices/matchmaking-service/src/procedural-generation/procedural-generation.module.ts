/**
 * Procedural Generation Module
 * Integrates all procedural generation components
 */

import { Module } from '@nestjs/common';
import { ProcedularGenerationAlgorithms } from './algorithms';
import { DifficultyAwareGenerationService } from './difficulty-aware-generation.service';
import { GenerationQualityAssessmentService } from './quality-assessment.service';
import { ParameterTuningService } from './parameter-tuning.service';
import { VarietyAndUniquenessService } from './variety-uniqueness.service';
import { PerformanceOptimizationService } from './performance-optimization.service';
import { GenerationAnalyticsService } from './analytics.service';
import { UserPreferenceCustomizationService } from './user-preference-customization.service';
import { ProceduralGenerationService } from './procedural-generation.service';
import { GenerationDebuggingQCService } from './debugging-qc.service';

@Module({
  providers: [
    ProcedularGenerationAlgorithms,
    DifficultyAwareGenerationService,
    GenerationQualityAssessmentService,
    ParameterTuningService,
    VarietyAndUniquenessService,
    PerformanceOptimizationService,
    GenerationAnalyticsService,
    UserPreferenceCustomizationService,
    ProceduralGenerationService,
    GenerationDebuggingQCService,
  ],
  exports: [
    ProceduralGenerationService,
    GenerationAnalyticsService,
    PerformanceOptimizationService,
    GenerationDebuggingQCService,
    VarietyAndUniquenessService,
    UserPreferenceCustomizationService,
  ],
})
export class ProceduralGenerationModule {}
