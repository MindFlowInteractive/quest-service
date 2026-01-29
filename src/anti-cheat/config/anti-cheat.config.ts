import { registerAs } from '@nestjs/config';
import { ActionType, Severity } from '../constants';

export interface AntiCheatConfig {
  enabled: boolean;
  thresholds: {
    minimumMoveTime: number;
    impossiblyFastThreshold: number;
    maxFastMoveRatio: number;
    minTimingVariance: number;
    roboticConsistencyThreshold: number;
    suspiciousAccuracyThreshold: number;
    perfectAccuracyMinMoves: number;
    zScoreThreshold: number;
    populationSampleSize: number;
    patternSimilarityThreshold: number;
    minPatternsForComparison: number;
    maxMovesPerSecond: number;
    maxPuzzlesPerMinute: number;
    initialTrustScore: number;
    minTrustScore: number;
    trustDecayPerViolation: Record<Severity, number>;
    trustRecoveryRate: number;
  };
  actions: {
    autoBlockEnabled: boolean;
    autoBlockThreshold: number;
    tempBanDuration: number;
    actionTiers: {
      TIER_1: { violations: number; action: ActionType };
      TIER_2: { violations: number; action: ActionType; duration: number };
      TIER_3: { violations: number; action: ActionType; duration: number };
      TIER_4: { violations: number; action: ActionType };
    };
  };
  analysis: {
    asyncAnalysisEnabled: boolean;
    batchAnalysisInterval: number;
    behaviorProfileUpdateFrequency: number;
    statisticalAnalysisEnabled: boolean;
    crossSessionAnalysisEnabled: boolean;
  };
  shadowMode: {
    enabled: boolean;
    blockMoves: boolean;
    createViolations: boolean;
    notifyPlayers: boolean;
    notifyAdmins: boolean;
    duration: number;
  };
  appeals: {
    enabled: boolean;
    autoApprovalForLowSeverity: boolean;
    maxAppealsPerViolation: number;
    appealReviewSLA: number;
  };
  reporting: {
    enabled: boolean;
    minReportsForAutoInvestigation: number;
    reportVotingEnabled: boolean;
    duplicateReportWindow: number;
  };
  logging: {
    logAllMoves: boolean;
    logSuspiciousMoves: boolean;
    retentionDays: number;
  };
}

export default registerAs('antiCheat', (): AntiCheatConfig => ({
  enabled: process.env.ANTI_CHEAT_ENABLED !== 'false',

  thresholds: {
    minimumMoveTime: parseInt(process.env.ANTI_CHEAT_MIN_MOVE_TIME || '100', 10),
    impossiblyFastThreshold: parseInt(process.env.ANTI_CHEAT_FAST_THRESHOLD || '150', 10),
    maxFastMoveRatio: parseFloat(process.env.ANTI_CHEAT_MAX_FAST_MOVE_RATIO || '0.8'),
    minTimingVariance: parseFloat(process.env.ANTI_CHEAT_MIN_TIMING_VARIANCE || '50'),
    roboticConsistencyThreshold: parseFloat(process.env.ANTI_CHEAT_ROBOTIC_THRESHOLD || '30'),
    suspiciousAccuracyThreshold: parseFloat(process.env.ANTI_CHEAT_SUSPICIOUS_ACCURACY || '0.95'),
    perfectAccuracyMinMoves: parseInt(process.env.ANTI_CHEAT_PERFECT_ACCURACY_MIN_MOVES || '15', 10),
    zScoreThreshold: parseFloat(process.env.ANTI_CHEAT_Z_SCORE_THRESHOLD || '3.0'),
    populationSampleSize: parseInt(process.env.ANTI_CHEAT_POPULATION_SAMPLE || '100', 10),
    patternSimilarityThreshold: parseFloat(process.env.ANTI_CHEAT_PATTERN_SIMILARITY || '0.9'),
    minPatternsForComparison: parseInt(process.env.ANTI_CHEAT_MIN_PATTERNS || '3', 10),
    maxMovesPerSecond: parseInt(process.env.ANTI_CHEAT_MAX_MOVES_PER_SECOND || '10', 10),
    maxPuzzlesPerMinute: parseInt(process.env.ANTI_CHEAT_MAX_PUZZLES_PER_MINUTE || '5', 10),
    initialTrustScore: parseInt(process.env.ANTI_CHEAT_INITIAL_TRUST_SCORE || '100', 10),
    minTrustScore: parseInt(process.env.ANTI_CHEAT_MIN_TRUST_SCORE || '0', 10),
    trustDecayPerViolation: {
      [Severity.LOW]: 5,
      [Severity.MEDIUM]: 10,
      [Severity.HIGH]: 25,
      [Severity.CRITICAL]: 50
    },
    trustRecoveryRate: parseFloat(process.env.ANTI_CHEAT_TRUST_RECOVERY || '1.0'),
  },

  actions: {
    autoBlockEnabled: process.env.ANTI_CHEAT_AUTO_BLOCK_ENABLED !== 'false',
    autoBlockThreshold: parseInt(process.env.ANTI_CHEAT_AUTO_BLOCK_THRESHOLD || '3', 10),
    tempBanDuration: parseInt(process.env.ANTI_CHEAT_TEMP_BAN_DURATION || '24', 10),
    actionTiers: {
      TIER_1: { violations: 1, action: ActionType.WARNING },
      TIER_2: { violations: 2, action: ActionType.TEMP_BAN, duration: 24 },
      TIER_3: { violations: 3, action: ActionType.TEMP_BAN, duration: 168 },
      TIER_4: { violations: 5, action: ActionType.PERMANENT_BAN }
    }
  },

  analysis: {
    asyncAnalysisEnabled: process.env.ANTI_CHEAT_ASYNC_ANALYSIS !== 'false',
    batchAnalysisInterval: parseInt(process.env.ANTI_CHEAT_BATCH_INTERVAL || '300', 10),
    behaviorProfileUpdateFrequency: parseInt(process.env.ANTI_CHEAT_PROFILE_UPDATE_FREQ || '10', 10),
    statisticalAnalysisEnabled: process.env.ANTI_CHEAT_STATISTICAL_ANALYSIS !== 'false',
    crossSessionAnalysisEnabled: process.env.ANTI_CHEAT_CROSS_SESSION_ANALYSIS !== 'false'
  },

  shadowMode: {
    enabled: process.env.ANTI_CHEAT_SHADOW_MODE !== 'false',
    blockMoves: process.env.ANTI_CHEAT_SHADOW_BLOCK_MOVES === 'true',
    createViolations: process.env.ANTI_CHEAT_SHADOW_CREATE_VIOLATIONS !== 'false',
    notifyPlayers: process.env.ANTI_CHEAT_SHADOW_NOTIFY_PLAYERS === 'true',
    notifyAdmins: process.env.ANTI_CHEAT_SHADOW_NOTIFY_ADMINS !== 'false',
    duration: parseInt(process.env.ANTI_CHEAT_SHADOW_DURATION || '30', 10)
  },

  appeals: {
    enabled: process.env.ANTI_CHEAT_APPEALS_ENABLED !== 'false',
    autoApprovalForLowSeverity: process.env.ANTI_CHEAT_AUTO_APPROVE_LOW === 'true',
    maxAppealsPerViolation: parseInt(process.env.ANTI_CHEAT_MAX_APPEALS || '1', 10),
    appealReviewSLA: parseInt(process.env.ANTI_CHEAT_APPEAL_SLA || '72', 10)
  },

  reporting: {
    enabled: process.env.ANTI_CHEAT_REPORTING_ENABLED !== 'false',
    minReportsForAutoInvestigation: parseInt(process.env.ANTI_CHEAT_MIN_REPORTS_AUTO || '3', 10),
    reportVotingEnabled: process.env.ANTI_CHEAT_REPORT_VOTING !== 'false',
    duplicateReportWindow: parseInt(process.env.ANTI_CHEAT_DUPLICATE_WINDOW || '7', 10)
  },

  logging: {
    logAllMoves: process.env.ANTI_CHEAT_LOG_ALL_MOVES === 'true',
    logSuspiciousMoves: process.env.ANTI_CHEAT_LOG_SUSPICIOUS !== 'false',
    retentionDays: parseInt(process.env.ANTI_CHEAT_LOG_RETENTION || '90', 10)
  }
}));
