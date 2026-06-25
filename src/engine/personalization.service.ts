import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserPreference } from '../entities/preference.entity';
import { AbVariation } from '../entities/variation.entity';
import * as crypto from 'crypto';

@Injectable()
export class PersonalizationService {
  constructor(
    @InjectRepository(UserPreference) private readonly prefRepo: Repository<UserPreference>,
    @InjectRepository(AbVariation) private readonly variantRepo: Repository<AbVariation>,
  ) {}

  /**
   * Learns and increments category affinity scores over time based on user interactions
   */
  async recordInteraction(userId: string, category: string, weight: number = 1.0): Promise<UserPreference> {
    let profile = await this.prefRepo.findOneBy({ userId });
    
    if (!profile) {
      profile = this.prefRepo.create({ userId, behavioralProfile: {}, categoryAffinities: {} });
    }

    const currentScore = profile.categoryAffinities[category] || 0;
    profile.categoryAffinities[category] = currentScore + weight;

    return this.prefRepo.save(profile);
  }

  /**
   * Deterministically assigns a user variant based on a hash of their ID
   */
  async getExperimentVariant(userId: string, experimentName: string): Promise<AbVariation> {
    const variants = await this.variantRepo.findBy({ experimentName });
    if (variants.length === 0) return null;

    // Create a stable routing footprint using consistent hashing
    const hash = crypto.createHash('md5').update(`${userId}:${experimentName}`).digest('hex');
    const index = parseInt(hash.substring(0, 8), 16) % variants.length;
    
    const assignedVariant = variants[index];
    
    // Increment tracking impression count out-of-band
    this.variantRepo.update(assignedVariant.id, { impressions: assignedVariant.impressions + 1 });
    
    return assignedVariant;
  }

  /**
   * Resolves tailored pricing structures, layouts, and recommended vault configurations
   */
  async resolvePersonalizedContext(userId: string) {
    const profile = await this.prefRepo.findOneBy({ userId });
    const activeExperiment = await this.getExperimentVariant(userId, 'pricing_tier_optimization');

    // Default Fallback Matrix
    let pricingTier = 'tier_standard';
    let layoutConfig = { density: 'default', showHighRiskVaults: false };

    // Dynamic Preference Adjustments
    if (profile) {
      const highYieldAffinity = profile.categoryAffinities['high_yield'] || 0;
      if (highYieldAffinity > 10) {
        layoutConfig.showHighRiskVaults = true;
        pricingTier = 'tier_preferred';
      }
    }

    // Overwrites layout payload configs if caught in an active experiment loop
    if (activeExperiment) {
      pricingTier = activeExperiment.configurationPayload.pricingTier || pricingTier;
      layoutConfig = { ...layoutConfig, ...activeExperiment.configurationPayload.layoutConfig };
    }

    return {
      userId,
      pricingTier,
      layoutConfig,
      experimentTrack: activeExperiment?.variantKey || 'none',
    };
  }
}