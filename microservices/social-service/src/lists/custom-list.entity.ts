import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { ListItem } from './list-item.entity';
import { ListShare } from './list-share.entity';

@Entity('custom_lists')
@Index(['userId'])
export class CustomList {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column('varchar')
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'boolean', default: false })
  isPublic: boolean;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => ListItem, (item) => item.list, { cascade: true })
  items: ListItem[];

  @OneToMany(() => ListShare, (share) => share.list, { cascade: true })
  shares: ListShare[];
}
