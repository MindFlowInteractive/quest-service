import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { CustomList } from './custom-list.entity';

@Entity('list_items')
@Index(['listId', 'puzzleId'], { unique: true })
@Index(['listId', 'order'])
export class ListItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  listId: string;

  @Column('uuid')
  puzzleId: string;

  @Column('integer')
  order: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  addedAt: Date;

  @ManyToOne(() => CustomList, (list) => list.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'listId' })
  list: CustomList;
}
