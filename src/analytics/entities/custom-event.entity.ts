@Entity('custom_events')
@Index(['funnelId', 'step'])
export class CustomEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  playerId: string;

  @Column()
  eventName: string;

  @Column({ nullable: true })
  @Index()
  funnelId: string;

  @Column({ type: 'int', nullable: true })
  step: number;

  @Column({ type: 'jsonb', default: {} })
  properties: Record<string, any>;

  @CreateDateColumn({ type: 'timestamptz' })
  @Index()
  timestamp: Date;
}
