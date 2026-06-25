import { Test } from '@nestjs/testing';
import { SegmentationRuleEngineService } from './segmentation-rule-engine.service';
import {
  RuleCategory,
  RuleCombinator,
  RuleOperator,
} from './interfaces/user-signal.interface';
import { Rule } from './entities/rule.entity';

function makeRule(
  overrides: Partial<Rule> & {
    field: string;
    operator: RuleOperator;
    value?: unknown;
  },
): Rule {
  return {
    id: overrides.id ?? 'rule-' + Math.random().toString(36).slice(2),
    segmentId: 'seg-1',
    field: overrides.field,
    operator: overrides.operator,
    value: overrides.value,
    combinator: overrides.combinator ?? RuleCombinator.AND,
    order: overrides.order ?? 0,
    category: overrides.category ?? RuleCategory.CUSTOM,
    isActive: overrides.isActive ?? true,
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Rule;
}

describe('SegmentationRuleEngineService', () => {
  let engine: SegmentationRuleEngineService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [SegmentationRuleEngineService],
    }).compile();

    engine = module.get(SegmentationRuleEngineService);
  });

  describe('matchesRule', () => {
    it('returns true for equals comparison', () => {
      const rule = makeRule({
        field: 'country',
        operator: RuleOperator.EQUALS,
        value: 'US',
      });
      expect(engine.matchesRule(rule, { userId: 'u', country: 'US' })).toBe(
        true,
      );
      expect(engine.matchesRule(rule, { userId: 'u', country: 'CA' })).toBe(
        false,
      );
    });

    it('handles IN operator with arrays', () => {
      const rule = makeRule({
        field: 'platform',
        operator: RuleOperator.IN,
        value: ['ios', 'android'],
      });
      expect(engine.matchesRule(rule, { userId: 'u', platform: 'ios' })).toBe(
        true,
      );
      expect(engine.matchesRule(rule, { userId: 'u', platform: 'web' })).toBe(
        false,
      );
    });

    it('handles BETWEEN operator', () => {
      const rule = makeRule({
        field: 'level',
        operator: RuleOperator.BETWEEN,
        value: [5, 10],
      });
      expect(engine.matchesRule(rule, { userId: 'u', level: 7 })).toBe(true);
      expect(engine.matchesRule(rule, { userId: 'u', level: 4 })).toBe(false);
      expect(engine.matchesRule(rule, { userId: 'u', level: 11 })).toBe(false);
    });

    it('handles REGEX operator', () => {
      const rule = makeRule({
        field: 'locale',
        operator: RuleOperator.REGEX,
        value: '^en_',
      });
      expect(engine.matchesRule(rule, { userId: 'u', locale: 'en_US' })).toBe(
        true,
      );
      expect(engine.matchesRule(rule, { userId: 'u', locale: 'fr_FR' })).toBe(
        false,
      );
    });

    it('treats missing field as NOT_EXISTS match', () => {
      const rule = makeRule({
        field: 'email',
        operator: RuleOperator.NOT_EXISTS,
      });
      expect(engine.matchesRule(rule, { userId: 'u' })).toBe(true);
      expect(
        engine.matchesRule(rule, {
          userId: 'u',
          attributes: { email: 'a@b.com' },
        }),
      ).toBe(false);
    });

    it('resolves nested attributes via dot-notation', () => {
      const rule = makeRule({
        field: 'attributes.plan',
        operator: RuleOperator.EQUALS,
        value: 'pro',
      });
      expect(
        engine.matchesRule(rule, {
          userId: 'u',
          attributes: { plan: 'pro' },
        }),
      ).toBe(true);
    });
  });

  describe('evaluate', () => {
    it('returns true with no rules (open segment)', () => {
      expect(engine.evaluate([], { userId: 'u' })).toBe(true);
    });

    it('combines AND rules and short-circuits on failure', () => {
      const rules = [
        makeRule({
          field: 'country',
          operator: RuleOperator.EQUALS,
          value: 'US',
          combinator: RuleCombinator.AND,
          order: 0,
        }),
        makeRule({
          field: 'platform',
          operator: RuleOperator.EQUALS,
          value: 'ios',
          combinator: RuleCombinator.AND,
          order: 1,
        }),
      ];
      expect(
        engine.evaluate(rules, {
          userId: 'u',
          country: 'US',
          platform: 'ios',
        }),
      ).toBe(true);
      expect(
        engine.evaluate(rules, {
          userId: 'u',
          country: 'US',
          platform: 'android',
        }),
      ).toBe(false);
    });

    it('returns true on the first OR match without evaluating later rules', () => {
      const rules = [
        makeRule({
          field: 'country',
          operator: RuleOperator.EQUALS,
          value: 'US',
          combinator: RuleCombinator.AND,
          order: 0,
        }),
        makeRule({
          field: 'platform',
          operator: RuleOperator.EQUALS,
          value: 'android',
          combinator: RuleCombinator.OR,
          order: 1,
        }),
      ];
      expect(
        engine.evaluate(rules, {
          userId: 'u',
          country: 'US',
          platform: 'ios',
        }),
      ).toBe(true);
      // OR: even if first AND fails, second OR can still match
      expect(
        engine.evaluate(rules, {
          userId: 'u',
          country: 'FR',
          platform: 'android',
        }),
      ).toBe(true);
    });

    it('skips inactive rules', () => {
      const rules = [
        makeRule({
          id: 'inactive',
          field: 'country',
          operator: RuleOperator.EQUALS,
          value: 'US',
          isActive: false,
          combinator: RuleCombinator.AND,
          order: 0,
        }),
      ];
      expect(engine.evaluate(rules, { userId: 'u', country: 'BR' })).toBe(true);
    });
  });
});
