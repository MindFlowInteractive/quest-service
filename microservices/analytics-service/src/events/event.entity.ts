import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  type: string;

  @Column()
  playerId: string;

  @Column('jsonb')
  data: any;

  @CreateDateColumn()
  timestamp: Date;
}
