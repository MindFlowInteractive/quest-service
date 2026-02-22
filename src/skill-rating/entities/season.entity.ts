import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum SeasonStatus {
  UPCOMING = 'upcoming',
  ACTIVE = 'active',
  ENDED = 'ended',
}

@Entity('seasons')
@Index(['status'])
@Index(['startDate', 'endDate'])
export class Season {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  @Index()
  name: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  @Index()
  seasonId: string;

  @Column({ type: 'varchar', length: 20, default: SeasonStatus.UPCOMING })
  @Index()
  status: SeasonStatus;

  @Column({ type: 'timestamp with time zone' })
  @Index()
  startDate: Date;

  @Column({ type: 'timestamp with time zone' })
  @Index()
  endDate: Date;

  @Column({ type: 'boolean', default: false })
  @Index()
  requiresReset: boolean;

  @Column({ type: 'int', default: 1200 })
  defaultRating: number;

  @Column({ type: 'jsonb', default: {} })
  config: {
    decayEnabled?: boolean;
    decayPeriodDays?: number;
    decayAmount?: number;
    minRating?: number;
    maxRating?: number;
    kFactor?: number;
    tierThresholds?: {
      bronze: number;
      silver: number;
      gold: number;
      platinum: number;
      diamond: number;
      master: number;
    };
  };

  @Column({ type: 'jsonb', default: {} })
  metadata: {
    description?: string;
    theme?: string;
    specialRewards?: any[];
    achievements?: string[];
  };

  @CreateDateColumn()
  @Index()
  createdAt: Date;

  @UpdateDateColumn()
  @Index()
  updatedAt: Date;
}
