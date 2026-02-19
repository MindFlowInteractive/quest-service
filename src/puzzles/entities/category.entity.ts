import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable } from 'typeorm';
import { Puzzle } from './puzzle.entity';
import { Collection } from './collection.entity';

@Entity()
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description?: string;

  @ManyToMany(() => Puzzle, (puzzle) => puzzle.categories)
  @JoinTable()
  puzzles: Puzzle[];

  @ManyToMany(() => Collection, (collection) => collection.categories)
  collections: Collection[];
}
