import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable } from 'typeorm';
import { Puzzle } from './puzzle.entity';

@Entity()
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description?: string;

  @ManyToMany(() => Puzzle, (puzzle) => puzzle.categories)
  @JoinTable() // This creates a join table for the many-to-many relationship
  puzzles: Puzzle[];
}
