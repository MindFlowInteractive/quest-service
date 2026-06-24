import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('variant')
export class Variant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  experimentId: string;

  @Column()
  name: string;

  @Column({ type: 'float', default: 1 })
  weight: number;
}
