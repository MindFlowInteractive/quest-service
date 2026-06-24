import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  action: string;

  @Column({ type: 'varchar' })
  entityType: string;

  @Column({ type: 'uuid' })
  entityId: string;

  @Column({ type: 'text', nullable: true })
  changes: string;

  @Column({ type: 'varchar', nullable: true })
  userId: string;

  @Column({ type: 'varchar', nullable: true })
  ipAddress: string;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ type: 'varchar', default: 'INFO' })
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

  @CreateDateColumn()
  createdAt: Date;
}
