import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum DataProcessingPurpose {
  GAMEPLAY = 'gameplay',
  ANALYTICS = 'analytics',
  MARKETING = 'marketing',
  PERSONALIZATION = 'personalization',
  THIRD_PARTY_SHARING = 'third_party_sharing',
  BLOCKCHAIN = 'blockchain',
}

export enum ConsentStatus {
  GRANTED = 'granted',
  DENIED = 'denied',
  WITHDRAWN = 'withdrawn',
  PENDING = 'pending',
}

@Entity('privacy_settings')
@Index(['userId'])
export class PrivacySettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', unique: true })
  userId: string;

  // Marketing consent
  @Column({ name: 'marketing_consent', default: false })
  marketingConsent: boolean;

  @Column({ name: 'marketing_consent_date', type: 'timestamptz', nullable: true })
  marketingConsentDate: Date;

  // Analytics consent
  @Column({ name: 'analytics_consent', default: true })
  analyticsConsent: boolean;

  @Column({ name: 'analytics_consent_date', type: 'timestamptz', nullable: true })
  analyticsConsentDate: Date;

  // Personalization consent
  @Column({ name: 'personalization_consent', default: true })
  personalizationConsent: boolean;

  @Column({ name: 'personalization_consent_date', type: 'timestamptz', nullable: true })
  personalizationConsentDate: Date;

  // Third party sharing consent
  @Column({ name: 'third_party_sharing_consent', default: false })
  thirdPartySharingConsent: boolean;

  @Column({ name: 'third_party_sharing_date', type: 'timestamptz', nullable: true })
  thirdPartySharingDate: Date;

  // Blockchain/On-chain data consent
  @Column({ name: 'blockchain_consent', default: true })
  blockchainConsent: boolean;

  @Column({ name: 'blockchain_consent_date', type: 'timestamptz', nullable: true })
  blockchainConsentDate: Date;

  // Data retention preferences
  @Column({ name: 'data_retention_days', type: 'int', default: 365 })
  dataRetentionDays: number;

  @Column({ name: 'auto_delete_enabled', default: false })
  autoDeleteEnabled: boolean;

  @Column({ name: 'auto_delete_after_days', type: 'int', nullable: true })
  autoDeleteAfterDays: number;

  // Profile visibility
  @Column({ name: 'profile_public', default: false })
  profilePublic: boolean;

  @Column({ name: 'show_on_leaderboard', default: true })
  showOnLeaderboard: boolean;

  @Column({ name: 'allow_friend_requests', default: true })
  allowFriendRequests: boolean;

  // Export/deletion tracking
  @Column({ name: 'last_export_date', type: 'timestamptz', nullable: true })
  lastExportDate: Date;

  @Column({ name: 'deletion_requested_at', type: 'timestamptz', nullable: true })
  deletionRequestedAt: Date;

  @Column({ name: 'deletion_completed_at', type: 'timestamptz', nullable: true })
  deletionCompletedAt: Date;

  @Column({ name: 'anonymized', default: false })
  anonymized: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
