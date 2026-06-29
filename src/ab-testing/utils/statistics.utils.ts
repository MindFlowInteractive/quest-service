/**
 * Statistical significance calculation utilities for A/B testing.
 */

export interface VariantStats {
  total_users: number;
  conversions: number;
  conversion_rate: number;
}

export interface SignificanceResult {
  z_score: number;
  significant: boolean;
  confidence_level: number;
  p_value?: number;
}

/**
 * Calculates two-proportion z-score for statistical significance.
 * Compares conversion rates between two variants.
 * 
 * @param variantA - Stats for variant A
 * @param variantB - Stats for variant B
 * @param confidenceLevel - Desired confidence level (default: 0.95 for 95%)
 * @returns Significance result with z-score and significance flag
 */
export function calculateZScore(
  variantA: VariantStats,
  variantB: VariantStats,
  confidenceLevel: number = 0.95,
): SignificanceResult {
  // Handle edge cases
  if (variantA.total_users === 0 || variantB.total_users === 0) {
    return {
      z_score: 0,
      significant: false,
      confidence_level: confidenceLevel,
    };
  }

  // Pooled proportion
  const pooled = (variantA.conversions + variantB.conversions) / 
                 (variantA.total_users + variantB.total_users);

  // Standard error
  const se = Math.sqrt(
    pooled * (1 - pooled) * (1 / variantA.total_users + 1 / variantB.total_users),
  );

  if (se === 0) {
    return {
      z_score: 0,
      significant: false,
      confidence_level: confidenceLevel,
    };
  }

  // Z-score
  const z = (variantA.conversion_rate - variantB.conversion_rate) / se;

  // Critical value for given confidence level
  const criticalValue = getCriticalValue(confidenceLevel);

  // Calculate p-value (two-tailed)
  const pValue = calculatePValue(z);

  return {
    z_score: parseFloat(z.toFixed(4)),
    significant: Math.abs(z) >= criticalValue,
    confidence_level: confidenceLevel,
    p_value: pValue,
  };
}

/**
 * Calculates chi-squared test for multiple variants.
 * Useful for comparing more than two variants.
 * 
 * @param variants - Array of variant stats
 * @returns Chi-squared statistic and significance
 */
export function calculateChiSquared(
  variants: VariantStats[],
): { chi_squared: number; significant: boolean; degrees_of_freedom: number } {
  if (variants.length < 2) {
    return {
      chi_squared: 0,
      significant: false,
      degrees_of_freedom: 0,
    };
  }

  // Calculate totals
  const totalUsers = variants.reduce((sum, v) => sum + v.total_users, 0);
  const totalConversions = variants.reduce((sum, v) => sum + v.conversions, 0);
  const overallConversionRate = totalConversions / totalUsers;

  // Expected conversions for each variant
  let chiSquared = 0;
  
  for (const variant of variants) {
    const expectedConversions = variant.total_users * overallConversionRate;
    const observedConversions = variant.conversions;
    
    if (expectedConversions > 0) {
      chiSquared += Math.pow(observedConversions - expectedConversions, 2) / expectedConversions;
    }
  }

  const degreesOfFreedom = variants.length - 1;
  const criticalValue = getChiSquaredCriticalValue(degreesOfFreedom, 0.95);

  return {
    chi_squared: parseFloat(chiSquared.toFixed(4)),
    significant: chiSquared >= criticalValue,
    degrees_of_freedom: degreesOfFreedom,
  };
}

/**
 * Calculates confidence interval for conversion rate.
 * 
 * @param conversionRate - Observed conversion rate
 * @param sampleSize - Number of users
 * @param confidenceLevel - Desired confidence level (default: 0.95)
 * @returns Confidence interval [lower, upper]
 */
export function calculateConfidenceInterval(
  conversionRate: number,
  sampleSize: number,
  confidenceLevel: number = 0.95,
): [number, number] {
  if (sampleSize === 0) {
    return [0, 0];
  }

  const criticalValue = getCriticalValue(confidenceLevel);
  const standardError = Math.sqrt(
    (conversionRate * (1 - conversionRate)) / sampleSize,
  );

  const marginOfError = criticalValue * standardError;
  
  const lower = Math.max(0, conversionRate - marginOfError);
  const upper = Math.min(1, conversionRate + marginOfError);

  return [parseFloat(lower.toFixed(4)), parseFloat(upper.toFixed(4))];
}

/**
 * Calculates required sample size for experiment.
 * 
 * @param baselineConversionRate - Expected conversion rate for control
 * @param minimumDetectableEffect - Minimum effect size to detect (e.g., 0.05 for 5%)
 * @param power - Statistical power (default: 0.8)
 * @param alpha - Significance level (default: 0.05)
 * @returns Required sample size per variant
 */
export function calculateRequiredSampleSize(
  baselineConversionRate: number,
  minimumDetectableEffect: number,
  power: number = 0.8,
  alpha: number = 0.05,
): number {
  const zAlpha = getCriticalValue(1 - alpha / 2); // Two-tailed
  const zBeta = getCriticalValue(power);
  
  const p1 = baselineConversionRate;
  const p2 = baselineConversionRate + minimumDetectableEffect;
  const pBar = (p1 + p2) / 2;
  
  const numerator = zAlpha * Math.sqrt(2 * pBar * (1 - pBar)) + 
                    zBeta * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2));
  const denominator = Math.abs(p1 - p2);
  
  const sampleSize = Math.pow(numerator / denominator, 2);
  return Math.ceil(sampleSize);
}

// ─── Private helper functions ──────────────────────────────────────────────

/**
 * Gets critical value (z-score) for given confidence level.
 */
function getCriticalValue(confidenceLevel: number): number {
  // Common confidence levels and their z-scores
  const zScores: Record<number, number> = {
    0.8: 1.28,   // 80% confidence
    0.85: 1.44,  // 85% confidence
    0.9: 1.645,  // 90% confidence
    0.95: 1.96,  // 95% confidence
    0.99: 2.576, // 99% confidence
  };

  return zScores[confidenceLevel] || 1.96; // Default to 95% confidence
}

/**
 * Gets chi-squared critical value for given degrees of freedom and confidence level.
 */
function getChiSquaredCriticalValue(degreesOfFreedom: number, confidenceLevel: number): number {
  // Simplified critical values for common degrees of freedom at 95% confidence
  // In production, use a proper statistical library
  const criticalValues: Record<number, number> = {
    1: 3.841,
    2: 5.991,
    3: 7.815,
    4: 9.488,
    5: 11.070,
    6: 12.592,
    7: 14.067,
    8: 15.507,
    9: 16.919,
    10: 18.307,
  };

  return criticalValues[degreesOfFreedom] || 20; // Conservative default
}

/**
 * Calculates two-tailed p-value from z-score.
 */
function calculatePValue(z: number): number {
  // Simplified approximation using normal CDF
  // In production, use a proper statistical library
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp(-z * z / 2);
  let p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  
  if (z > 0) p = 1 - p;
  return 2 * p; // Two-tailed
}