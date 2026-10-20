import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Puzzle } from './puzzle.entity';
import { Collection } from './collection.entity';

@Entity()
@Index(['parentCategory', 'sortOrder'])
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 100, unique: true, nullable: true })
  slug?: string;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @ManyToOne(() => Category, (category) => category.children, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'parentCategoryId' })
  parentCategory?: Category;

  @OneToMany(() => Category, (category) => category.parentCategory)
  children: Category[];

  @ManyToMany(() => Puzzle, (puzzle) => puzzle.categories)
  @JoinTable()
  puzzles: Puzzle[];

  @ManyToMany(() => Collection, (collection) => collection.categories)
  collections: Collection[];
}
