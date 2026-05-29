import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum ReportFormat {
  CSV = 'csv',
  PDF = 'pdf',
  JSON = 'json',
}

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'jsonb', default: {} })
  query: Record<string, unknown>;

  @Column({ type: 'enum', enum: ReportFormat, default: ReportFormat.JSON })
  format: ReportFormat;

  @Column({ nullable: true })
  scheduledCron: string;

  @CreateDateColumn()
  createdAt: Date;
}