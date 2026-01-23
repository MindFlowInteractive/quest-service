@Entity('abtest_results')
@Index(['testId', 'variant'])
export class ABTestResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  testId: string;

  @Column()
  @Index()
  playerId: string;

  @Column()
  variant: string; // A, B, C, etc.

  @Column({ type: 'float' })
  metricValue: number;

  @Column()
  metricName: string;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn({ type: 'timestamptz' })
  @Index()
  timestamp: Date;
}