import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Flag {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  key: string;

  @Column({ default: true })
  enabled: boolean;

  @Column({ default: 100 })
  rollout: number;

  @Column('simple-array')
  variants: string[];

  @Column('json', { nullable: true })
  schedule: Record<string, unknown>;
}

@Entity()
export class Segment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column('json')
  criteria: Record<string, unknown>;
}

@Entity()
export class Rule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  flagKey: string;

  @Column()
  segmentName: string;

  @Column({ default: true })
  enabled: boolean;
}
