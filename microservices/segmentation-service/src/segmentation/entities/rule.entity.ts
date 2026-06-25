import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Segment } from './segment.entity';
import {
  RuleCategory,
  RuleCombinator,
  RuleOperator,
} from '../interfaces/user-signal.interface';

@Entity('rules')
@Index('idx_rules_segment_order', ['segmentId', 'order'])
export class Rule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  segmentId: string;

  @ManyToOne(() => Segment, (segment) => segment.rules, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'segment_id' })
  segment: Segment;

  @Column({ type: 'varchar', length: 120 })
  field: string;

  @Column({
    type: 'enum',
    enum: RuleOperator,
  })
  operator: RuleOperator;

  /**
   * Stored as jsonb so operators like `in`, `notIn`, `between` can carry arrays
   * while single-value operators carry primitives.
   */
  @Column({ type: 'jsonb', nullable: true })
  value: unknown;

  @Column({
    type: 'enum',
    enum: RuleCategory,
    default: RuleCategory.CUSTOM,
  })
  category: RuleCategory;

  @Column({
    type: 'enum',
    enum: RuleCombinator,
    default: RuleCombinator.AND,
  })
  combinator: RuleCombinator;

  /**
   * Order in which rules are combined inside a rule group. Lower numbers run
   * first.
   */
  @Column({ type: 'int', default: 0 })
  order: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  metadata: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
