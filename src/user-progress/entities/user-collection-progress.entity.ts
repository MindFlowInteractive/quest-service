import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, ManyToMany, JoinTable } from 'typeorm';
import { User } from '../../users/entities/user.entity'; // Assuming user entity path
import { Collection } from '../../puzzles/entities/collection.entity'; // Assuming collection entity path
import { Puzzle } from '../../puzzles/entities/puzzle.entity'; // Assuming puzzle entity path

@Entity('user_collection_progress')
export class UserCollectionProgress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.collectionProgress)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'uuid' })
  userId: string; // Foreign key to User

  @ManyToOne(() => Collection, (collection) => collection.userProgress)
  @JoinColumn({ name: 'collectionId' })
  collection: Collection;

  @Column({ type: 'uuid' })
  collectionId: string; // Foreign key to Collection

  @ManyToMany(() => Puzzle)
  @JoinTable({ name: 'user_collection_progress_completed_puzzles' })
  completedPuzzles: Puzzle[]; // List of puzzles completed within this collection

  @Column({ type: 'int', default: 0 })
  percentageComplete: number; // Calculated percentage

  @Column({ type: 'boolean', default: false })
  isCompleted: boolean; // Flag for when 100% complete
}
