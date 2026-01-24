import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable, OneToMany } from 'typeorm';
import { Puzzle } from './puzzle.entity';
import { Category } from './category.entity';
import { UserCollectionProgress } from '../../user-progress/entities/user-collection-progress.entity';

@Entity()
export class Collection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @ManyToMany(() => Puzzle, (puzzle) => puzzle.collections)
  @JoinTable()
  puzzles: Puzzle[];

  @ManyToMany(() => Category, (category) => category.collections)
  @JoinTable()
  categories?: Category[];

  @OneToMany(() => UserCollectionProgress, (userCollectionProgress) => userCollectionProgress.collection)
  userProgress: UserCollectionProgress[];

  // --- New field for rewards ---
  @Column({ type: 'jsonb', default: [] })
  rewards: Array<{
    type: string; // e.g., 'currency', 'item', 'experience'
    value: any;   // e.g., { amount: 100 } for currency, { itemId: 'uuid', quantity: 1 } for item
    quantity?: number; // Optional quantity for items
  }>;
}