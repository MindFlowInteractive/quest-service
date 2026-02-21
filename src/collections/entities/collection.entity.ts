import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Category } from './category.entity';

@Entity({ name: 'collection' })
export class CollectionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'uuid', nullable: true })
  category_id?: string;

  @ManyToOne(() => Category, { nullable: true })
  @JoinColumn({ name: 'category_id' })
  category?: Category;

  @Column({ type: 'int', default: 1 })
  difficulty: number;

  @Index()
  @Column({ type: 'boolean', default: false })
  is_featured: boolean;

  @Column({ type: 'text', default: 'points' })
  reward_type: string;

  @Column({ type: 'int', default: 0 })
  reward_value: number;

  @Column({ type: 'datetime', default: () => "(datetime('now'))" })
  created_at: Date;
}
