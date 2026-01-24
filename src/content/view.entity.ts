import { Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from 'typeorm';
import { Content } from './contents.entity';
import { User } from '../users/entities/user.entity';

@Entity('views')
export class View {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Content, (content) => content.views)
    content: Content;

    @ManyToOne(() => User, { nullable: true })
    user: User | null;

    @CreateDateColumn()
    createdAt: Date;
}
