import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  type: string; // e.g., 'daily', 'monthly', 'on-demand'

  @Column('jsonb')
  data: any;

  @CreateDateColumn()
  generatedAt: Date;
}
