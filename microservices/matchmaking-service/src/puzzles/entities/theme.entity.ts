import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable } from 'typeorm';
import { Collection } from './collection.entity'; // Assuming themes can be applied to collections

@Entity('themes')
export class Theme {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description?: string;

  @ManyToMany(() => Collection, (collection) => collection.themes)
  @JoinTable() // This creates a join table for the many-to-many relationship
  collections: Collection[];
}
