import { Injectable, Logger } from '@nestjs/common';
import { Rule } from './entities/rule.entity';
import {
  RuleCombinator,
  RuleOperator,
  UserSignal,
} from './interfaces/user-signal.interface';

@Injectable()
export class SegmentationRuleEngineService {
  private readonly logger = new Logger(SegmentationRuleEngineService.name);

  /**
   * Public entry point - returns true iff the supplied signal satisfies the
   * active rule chain. Rules are evaluated in ascending `order`. Each rule's
   * declared `combinator` describes how it joins with the *previous* rule;
   * the first rule's combinator is therefore ignored (there is no previous
   * rule) and defaults to AND.
   */
  evaluate(rules: Rule[], signal: UserSignal | null): boolean {
    const active = (rules ?? [])
      .filter((rule) => rule.isActive !== false)
      .sort((left, right) => (left.order ?? 0) - (right.order ?? 0));

    if (active.length === 0) {
      // No rules = every user matches (open segment).
      return true;
    }

    let result: boolean | null = null;

    for (let index = 0; index < active.length; index += 1) {
      const rule = active[index];
      const matches = this.matchesRule(rule, signal);

      if (index === 0) {
        result = matches;
        continue;
      }

      const combinator = rule.combinator ?? RuleCombinator.AND;

      if (combinator === RuleCombinator.OR) {
        result = (result ?? false) || matches;
      } else {
        // AND combinator (default)
        result = (result ?? false) && matches;
      }
    }

    return result ?? true;
  }

  matchesRule(rule: Rule, signal: UserSignal | null): boolean {
    if (!signal) {
      return rule.operator === RuleOperator.NOT_EXISTS;
    }

    const fieldValue = this.resolveField(rule.field, signal);
    return this.applyOperator(rule.operator, fieldValue, rule.value);
  }

  /**
   * Resolve a field path like `attributes.country` into the deeply-nested
   * value on the user signal. Supports dot-notation paths up to two levels.
   */
  resolveField(field: string, signal: UserSignal): unknown {
    if (!field) {
      return undefined;
    }

    const direct = (signal as unknown as Record<string, unknown>)[field];
    if (direct !== undefined) {
      return direct;
    }

    if (field.startsWith('attributes.')) {
      const nestedPath = field.slice('attributes.'.length);
      const attributes = (signal.attributes ?? {}) as Record<string, unknown>;
      return attributes[nestedPath];
    }

    const attributes = (signal.attributes ?? {}) as Record<string, unknown>;
    if (attributes[field] !== undefined) {
      return attributes[field];
    }

    return undefined;
  }

  applyOperator(
    operator: RuleOperator,
    fieldValue: unknown,
    ruleValue: unknown,
  ): boolean {
    switch (operator) {
      case RuleOperator.EQUALS:
        return this.toComparable(fieldValue) === this.toComparable(ruleValue);

      case RuleOperator.NOT_EQUALS:
        return this.toComparable(fieldValue) !== this.toComparable(ruleValue);

      case RuleOperator.IN:
        return Array.isArray(ruleValue)
          ? (ruleValue as unknown[]).some(
              (candidate) =>
                this.toComparable(candidate) === this.toComparable(fieldValue),
            )
          : false;

      case RuleOperator.NOT_IN:
        if (!Array.isArray(ruleValue)) {
          return false;
        }
        return !(ruleValue as unknown[]).some(
          (candidate) =>
            this.toComparable(candidate) === this.toComparable(fieldValue),
        );

      case RuleOperator.CONTAINS:
        if (typeof fieldValue === 'string' && typeof ruleValue === 'string') {
          return fieldValue.includes(ruleValue);
        }
        if (Array.isArray(fieldValue)) {
          return (fieldValue as unknown[]).some(
            (entry) =>
              this.toComparable(entry) === this.toComparable(ruleValue),
          );
        }
        return false;

      case RuleOperator.NOT_CONTAINS:
        if (typeof fieldValue === 'string' && typeof ruleValue === 'string') {
          return !fieldValue.includes(ruleValue);
        }
        if (Array.isArray(fieldValue)) {
          return !(fieldValue as unknown[]).some(
            (entry) =>
              this.toComparable(entry) === this.toComparable(ruleValue),
          );
        }
        return true;

      case RuleOperator.GT:
        return this.toNumber(fieldValue) > this.toNumber(ruleValue);

      case RuleOperator.GTE:
        return this.toNumber(fieldValue) >= this.toNumber(ruleValue);

      case RuleOperator.LT:
        return this.toNumber(fieldValue) < this.toNumber(ruleValue);

      case RuleOperator.LTE:
        return this.toNumber(fieldValue) <= this.toNumber(ruleValue);

      case RuleOperator.BETWEEN: {
        if (
          !Array.isArray(ruleValue) ||
          (ruleValue as unknown[]).length !== 2
        ) {
          return false;
        }
        const [min, max] = ruleValue as [unknown, unknown];
        const numeric = this.toNumber(fieldValue);
        return numeric >= this.toNumber(min) && numeric <= this.toNumber(max);
      }

      case RuleOperator.EXISTS:
        return fieldValue !== undefined && fieldValue !== null;

      case RuleOperator.NOT_EXISTS:
        return fieldValue === undefined || fieldValue === null;

      case RuleOperator.REGEX: {
        if (typeof ruleValue !== 'string' || typeof fieldValue !== 'string') {
          return false;
        }
        try {
          return new RegExp(ruleValue).test(fieldValue);
        } catch (error) {
          this.logger.warn(
            `Invalid regex in rule value: ${ruleValue}: ${(error as Error).message}`,
          );
          return false;
        }
      }

      default:
        return false;
    }
  }

  private toComparable(value: unknown): unknown {
    if (value === undefined || value === null) {
      return value;
    }
    if (value instanceof Date) {
      return value.getTime();
    }
    if (typeof value === 'bigint') {
      return value.toString();
    }
    return value;
  }

  private toNumber(value: unknown): number {
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : NaN;
    }
    if (value instanceof Date) {
      return value.getTime();
    }
    if (typeof value === 'boolean') {
      return value ? 1 : 0;
    }
    return NaN;
  }
}
