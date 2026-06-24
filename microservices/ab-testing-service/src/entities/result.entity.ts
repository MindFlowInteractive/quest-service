import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('result')
export class Result {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  experimentId: string;

  @Column()
  variantId: string;

  @Column()
  userId: string;

  @Column({ type: 'float', nullable: true })
  metric: number;

  @CreateDateColumn()
  createdAt: Date;
}
