import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('rollbacks_log')
export class RollbackEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'migration_id' })
  migrationId: string;

  @Column({ name: 'target_database' })
  targetDatabase: string;

  @Column()
  reason: string;

  @Column({ name: 'executor', nullable: true })
  executor: string;

  @CreateDateColumn({ name: 'rolled_back_at' })
  rolledBackAt: Date;
}
