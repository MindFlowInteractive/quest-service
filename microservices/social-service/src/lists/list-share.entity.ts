import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { CustomList } from './custom-list.entity';

export enum SharePermission {
  VIEW = 'view',
  EDIT = 'edit',
}

@Entity('list_shares')
@Index(['listId', 'sharedWithUserId'], { unique: true })
export class ListShare {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  listId: string;

  @Column('uuid')
  sharedWithUserId: string;

  @Column({
    type: 'enum',
    enum: SharePermission,
    default: SharePermission.VIEW,
  })
  permission: SharePermission;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  sharedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => CustomList, (list) => list.shares, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'listId' })
  list: CustomList;
}
