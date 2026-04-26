import { Entity, Column, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('metrics')
export class Metric {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('float')
  value: number;

  @Column('jsonb', { nullable: true })
  dimensions: any;

  @UpdateDateColumn()
  lastUpdated: Date;
}
