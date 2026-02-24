import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum ConsentAction {
  GRANTED = 'granted',
  DENIED = 'denied',
  WITHDRAWN = 'withdrawn',
  UPDATED = 'updated',
  EXPIRED = 'expired',
}

export enum ConsentType {
  TERMS_OF_SERVICE = 'terms_of_service',
  PRIVACY_POLICY = 'privacy_policy',
  MARKETING = 'marketing',
  ANALYTICS = 'analytics',
  PERSONALIZATION = 'personalization',
  THIRD_PARTY_SHARING = 'third_party_sharing',
  BLOCKCHAIN = 'blockchain',
  COOKIES = 'cookies',
  DATA_PROCESSING = 'data_processing',
}

@Entity('consent_logs')
@Index(['userId'])
@Index(['consentType'])
@Index(['action'])
@Index(['createdAt'])
@Index(['userId', 'consentType'])
export class ConsentLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({
    name: 'consent_type',
    type: 'enum',
    enum: ConsentType,
  })
  consentType: ConsentType;

  @Column({
    name: 'action',
    type: 'enum',
    enum: ConsentAction,
  })
  action: ConsentAction;

  @Column({ name: 'version', length: 50 })
  version: string;

  @Column({ name: 'ip_address', length: 45, nullable: true })
  ipAddress: string;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string;

  @Column({ name: 'country', length: 2, nullable: true })
  country: string;

  @Column({ type: 'jsonb', name: 'metadata', nullable: true })
  metadata: {
    previousValue?: boolean;
    newValue?: boolean;
    reason?: string;
    source?: string;
  };

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
