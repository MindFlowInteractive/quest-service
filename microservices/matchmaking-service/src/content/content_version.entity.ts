import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Content } from './contents.entity';

@Entity('content_versions')
export class ContentVersion {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('text')
    body: string;

    @Column()
    version: number;

    @ManyToOne(() => Content, (content) => content.versions)
    content: Content;
}
