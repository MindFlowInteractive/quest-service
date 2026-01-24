import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Tournament } from './tournament.entity';
import { Challenge } from './challenge.entity';

@Entity()
export class Event {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'datetime' })
  startTime: Date;

  @Column({ type: 'datetime' })
  endTime: Date;

  @OneToMany(() => Tournament, (tournament) => tournament.event)
  tournaments: Tournament[];

  @OneToMany(() => Challenge, (challenge) => challenge.event)
  challenges: Challenge[];
}
