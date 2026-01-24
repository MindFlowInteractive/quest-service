import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Content } from './contents.entity';

@Entity('categories')
export class Category {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    name: string;

    @OneToMany(() => Content, (content) => content.category)
    contents: Content[];
}
