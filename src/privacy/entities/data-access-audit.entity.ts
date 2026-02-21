import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum DataAccessType {
  READ = 'read',
  WRITE = 'write',
  DELETE = 'delete',
  EXPORT = 'export',
  ANONYMIZE = 'anonymize',
  ACCESS = 'access',
}

export enum DataAccessEntity {
  USER = 'user',
  PROFILE = 'profile',
  GAME_SESSION = 'game_session',
  TRANSACTION = 'transaction',
  ACHIEVEMENT = 'achievement',
  LEADERBOARD = 'leaderboard',
  WALLET = 'wallet',
  SETTINGS = 'settings',
}

export enum AccessReason {
  USER_REQUEST = 'user_request',
  ADMIN_ACTION = 'admin_action',
  SYSTEM_PROCESS = 'system_process',
  DATA_EXPORT = 'data_export',
  DATA_DELETION = 'data_deletion',
  ANONYMIZATION = 'anonymization',
  SUPPORT_TICKET = 'support_ticket',
  LEGAL_REQUEST = 'legal_request',
  AUDIT = 'audit',
}

@Entity('data_access_audit')
@Index(['userId'])
@Index(['accessedBy'])
@Index(['accessType'])
@Index(['entityType'])
@Index(['createdAt'])
@Index(['userId', 'accessType'])
export class DataAccessAudit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'accessed_by' })
  accessedBy: string;

  @Column({
    name: 'access_type',
    type: 'enum',
    enum: DataAccessType,
  })
  accessType: DataAccessType;

  @Column({
    name: 'entity_type',
    type: 'enum',
    enum: DataAccessEntity,
  })
  entityType: DataAccessEntity;

  @Column({ name: 'entity_id', nullable: true })
  entityId: string;

  @Column({
    name: 'access_reason',
    type: 'enum',
    enum: AccessReason,
  })
  accessReason: AccessReason;

  @Column({ name: 'ip_address', length: 45, nullable: true })
  ipAddress: string;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string;

  @Column({ type: 'jsonb', name: 'access_details', nullable: true })
  accessDetails: {
    fieldsAccessed?: string[];
    queryParams?: any;
    endpoint?: string;
    method?: string;
  };

  @Column({ type: 'jsonb', name: 'changes_made', nullable: true })
  changesMade: {
    before?: any;
    after?: any;
  };

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
