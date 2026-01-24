import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { Content } from './contents.entity';

@Entity('tags')
export class Tag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @ManyToMany(() => Content, (content) => content.tags)
  contents: Content[];
}
