import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Flag, Rule, Segment } from './entities';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(Flag)
    private readonly flagRepository: Repository<Flag>,
    @InjectRepository(Segment)
    private readonly segmentRepository: Repository<Segment>,
    @InjectRepository(Rule)
    private readonly ruleRepository: Repository<Rule>,
  ) {}

  async evaluateFlag(key: string, userId: string, segment?: string) {
    const flag = await this.flagRepository.findOne({ where: { key } });
    if (!flag) {
      throw new NotFoundException(`Feature flag ${key} not found`);
    }

    if (!flag.enabled) {
      return { key, active: false, reason: 'flag_disabled' };
    }

    const rollout = flag.rollout || 100;
    const rolloutValue = userId ? this.hashUser(userId) : Math.random() * 100;
    const rolloutActive = rolloutValue <= rollout;

    if (segment) {
      const segmentEntity = await this.segmentRepository.findOne({ where: { name: segment } });
      if (!segmentEntity) {
        return { key, active: false, reason: 'segment_not_found' };
      }
      const rule = await this.ruleRepository.findOne({ where: { flagKey: key, segmentName: segment } });
      if (rule && !rule.enabled) {
        return { key, active: false, reason: 'rule_disabled' };
      }
    }

    const variant = flag.variants[Math.floor(Math.random() * flag.variants.length)];

    return {
      key,
      active: rolloutActive,
      variant: rolloutActive ? variant : 'disabled',
      rollout,
      segment: segment || 'default',
    };
  }

  async createFlag(key: string, enabled: boolean, rollout: number, variants: string[], schedule: Record<string, unknown>) {
    const flag = this.flagRepository.create({ key, enabled, rollout, variants, schedule });
    return this.flagRepository.save(flag);
  }

  async createSegment(name: string, criteria: Record<string, unknown>) {
    const segment = this.segmentRepository.create({ name, criteria });
    return this.segmentRepository.save(segment);
  }

  async createRule(flagKey: string, segmentName: string, enabled: boolean) {
    const rule = this.ruleRepository.create({ flagKey, segmentName, enabled });
    return this.ruleRepository.save(rule);
  }

  private hashUser(userId: string) {
    let hash = 0;
    for (let i = 0; i < userId.length; i += 1) {
      hash = (hash << 5) - hash + userId.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash) % 100;
  }
}
