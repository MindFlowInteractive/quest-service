import { Puzzle } from "src/database/entities";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";


@Entity()
export class Events {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column()
  startDate: Date;

  @Column()
  endDate: Date;

  @Column({ default: false })
  isActive: boolean;

  // An Event can have multiple Puzzles
  @OneToMany(() => Puzzle, puzzle => puzzle.event, { cascade: true })
  puzzles: Puzzle[];
}
